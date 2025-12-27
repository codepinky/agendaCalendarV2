import './SkeletonLoader.css';

interface SkeletonLoaderProps {
  width?: string;
  height?: string;
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  lines?: number;
}

function SkeletonLoader({
  width,
  height,
  className = '',
  variant = 'rectangular',
  lines = 1,
}: SkeletonLoaderProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={`skeleton-loader skeleton-text ${className}`}>
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className="skeleton-line"
            style={{
              width: index === lines - 1 ? '60%' : '100%',
              height: height || '1rem',
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={`skeleton-loader skeleton-${variant} ${className}`}
      style={{
        width: width || '100%',
        height: height || variant === 'circular' ? width || '40px' : '1rem',
      }}
    />
  );
}

export default SkeletonLoader;





