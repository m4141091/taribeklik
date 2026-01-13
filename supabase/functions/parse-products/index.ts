import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { text } = await req.json();
    
    if (!text || typeof text !== 'string') {
      return new Response(
        JSON.stringify({ error: 'טקסט לא תקין' }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `אתה מערכת לזיהוי מוצרים מטקסט חופשי בעברית.
המשתמש יכתוב רשימת מוצרים בכל פורמט שנוח לו - עם פסיקים, בשורות, או ברצף אחד.
עליך לזהות כל מוצר, ואם יש מחיר - לזהות אותו גם.
אם מוזכר "לקילו" או "ק"ג" או "kg" - סוג התמחור הוא kg, אחרת unit.

דוגמאות:
- "עגבניות מלפפונים גזר" → 3 מוצרים
- "בננות 12 שקל לקילו" → מוצר אחד, מחיר 12, סוג kg
- "תפוחים 8 ש"ח" → מוצר אחד, מחיר 8, סוג unit`
          },
          {
            role: "user",
            content: text
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_products",
              description: "חלץ רשימת מוצרים מהטקסט",
              parameters: {
                type: "object",
                properties: {
                  products: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "שם המוצר" },
                        price: { type: "number", description: "מחיר אם קיים, null אחרת" },
                        pricing_type: { type: "string", enum: ["kg", "unit"], description: "סוג תמחור" }
                      },
                      required: ["name", "pricing_type"]
                    }
                  }
                },
                required: ["products"]
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_products" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "יותר מדי בקשות, נסי שוב בעוד דקה" }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "נגמרו הקרדיטים, יש להוסיף קרדיטים" }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "שגיאה בזיהוי המוצרים" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    
    // Extract the function call result
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall || toolCall.function.name !== "extract_products") {
      return new Response(
        JSON.stringify({ error: "לא הצלחתי לזהות מוצרים" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = JSON.parse(toolCall.function.arguments);
    
    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Parse products error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "שגיאה לא ידועה" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
