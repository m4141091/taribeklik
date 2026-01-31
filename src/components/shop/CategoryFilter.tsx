import React from 'react';
import { Category } from '@/types/category';
import { Button } from '@/components/ui/button';

interface CategoryFilterProps {
  categories: Category[];
  selectedCategory: string | null;
  onSelectCategory: (categoryId: string | null) => void;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
}) => {
  return (
    <div className="flex flex-wrap gap-2 justify-center">
      <Button
        variant={selectedCategory === null ? 'default' : 'outline'}
        onClick={() => onSelectCategory(null)}
        className={`rounded-full ${
          selectedCategory === null
            ? 'bg-gradient-to-r from-brand-orange-light to-brand-orange text-white'
            : 'border-border'
        }`}
      >
        הכל
      </Button>
      {categories.map((category) => (
        <Button
          key={category.id}
          variant={selectedCategory === category.id ? 'default' : 'outline'}
          onClick={() => onSelectCategory(category.id)}
          className={`rounded-full ${
            selectedCategory === category.id
              ? 'bg-gradient-to-r from-brand-orange-light to-brand-orange text-white'
              : 'border-border'
          }`}
        >
          {category.name}
        </Button>
      ))}
    </div>
  );
};

export default CategoryFilter;
