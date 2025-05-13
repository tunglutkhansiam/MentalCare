import { useLocation } from "wouter";
import { Category } from "@shared/schema";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  const [, navigate] = useLocation();

  const handleClick = () => {
    // Navigate to experts filtered by this category
    navigate(`/?category=${category.id}`);
  };

  return (
    <div 
      className="flex-none bg-white shadow-sm rounded-lg p-3 w-24 flex flex-col items-center cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleClick}
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
        style={{ backgroundColor: category.backgroundColor }}
      >
        <span className="text-primary">{category.icon}</span>
      </div>
      <span className="text-xs font-medium text-center">{category.name}</span>
    </div>
  );
}
