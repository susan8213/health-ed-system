import React, { ReactNode } from 'react';

interface CardProps {
  className?: string;
  children: ReactNode;
}

function Card({ className, children }: CardProps) {
  return (
    <div className={`card ${className || ''}`.trim()}>
      {children}
    </div>
  );
}

interface CardSectionProps {
  children: ReactNode;
}

Card.Header = function CardHeader({ children }: CardSectionProps) {
  return <div className="card-header">{children}</div>;
};

Card.Content = function CardContent({ children }: CardSectionProps) {
  return <div className="card-content">{children}</div>;
};

Card.Footer = function CardFooter({ children }: CardSectionProps) {
  return <div className="card-footer">{children}</div>;
};

export default Card;
