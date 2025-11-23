import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { H3, Body } from "@/components/ui/typography";

interface CategoryCardProps {
  id: string;
  name: string;
  description?: string | null;
  imageUrl?: string;
}

export const CategoryCard = ({ id, name, description, imageUrl }: CategoryCardProps) => {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(`/?category=${id}`)}
      className="group cursor-pointer overflow-hidden border border-border/40 hover:border-primary/50 hover:shadow-lg transition-all duration-300 bg-background"
    >
      <div className="aspect-video overflow-hidden bg-muted/30">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
            <span className="text-4xl font-bold text-primary/30">{name.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className="p-4 text-center">
        <H3 className="text-foreground group-hover:text-primary transition-colors">
          {name}
        </H3>
        {description && (
          <Body size="small" className="text-muted-foreground mt-1 line-clamp-2">
            {description}
          </Body>
        )}
      </div>
    </Card>
  );
};
