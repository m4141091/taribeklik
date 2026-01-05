import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { z } from 'zod';

const authSchema = z.object({
  email: z.string().email('אימייל לא תקין'),
  password: z.string().min(6, 'סיסמה חייבת להכיל לפחות 6 תווים'),
});

const Login = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp, user } = useAuthContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/admin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const validation = authSchema.safeParse({ email, password });
      if (!validation.success) {
        toast({
          title: 'שגיאה',
          description: validation.error.errors[0].message,
          variant: 'destructive',
        });
        setLoading(false);
        return;
      }

      if (isSignUp) {
        const { error } = await signUp(email, password);
        if (error) {
          let message = 'שגיאה בהרשמה';
          if (error.message.includes('already registered')) {
            message = 'המשתמש כבר רשום במערכת';
          }
          toast({
            title: 'שגיאה',
            description: message,
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'הרשמה הצליחה!',
            description: 'נרשמת בהצלחה. אנא פנה למנהל לקבלת הרשאות.',
          });
        }
      } else {
        const { error } = await signIn(email, password);
        if (error) {
          let message = 'שגיאה בהתחברות';
          if (error.message.includes('Invalid login credentials')) {
            message = 'אימייל או סיסמה שגויים';
          }
          toast({
            title: 'שגיאה',
            description: message,
            variant: 'destructive',
          });
        } else {
          navigate('/admin');
        }
      }
    } catch (err) {
      toast({
        title: 'שגיאה',
        description: 'אירעה שגיאה לא צפויה',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-lg shadow-lg p-8 border border-border">
          <h1 className="text-2xl font-bold text-foreground text-center mb-6">
            {isSignUp ? 'הרשמה' : 'התחברות'}
          </h1>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                אימייל
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                dir="ltr"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                סיסמה
              </label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                dir="ltr"
                required
              />
            </div>
            
            <Button
              type="submit"
              className="w-full"
              disabled={loading}
            >
              {loading ? 'טוען...' : isSignUp ? 'הרשמה' : 'התחברות'}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline text-sm"
            >
              {isSignUp ? 'יש לך חשבון? התחבר' : 'אין לך חשבון? הרשם'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
