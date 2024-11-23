const Hexagon = ({ 
    size = 80, 
    color = '#4a90e2', 
    hoverColor = '#b10808',
    className = '',
    children,
    variant = 'pointed',
    onClick,
    href,
    ariaLabel
  }) => {
    const getHexagonDimensions = () => {
      if (variant === 'pointed') {
        return {
          width: size,
          height: size * 0.57735,
          margin: `${size * 0.4}px 2px`,
          padding: '22px',
          triangleWidth: size / 2,
          triangleHeight: size * 0.288675
        };
      } else {
        return {
          width: size * 0.6,
          height: size * 0.85,
          margin: `0 ${size * 0.25}px`,
          triangleWidth: size * 0.433,
          triangleHeight: size * 0.25
        };
      }
    };
  
    const dimensions = getHexagonDimensions();
  
    // Determine if we should render a div or anchor
    const Component = href ? 'a' : 'div';
    const interactiveProps = href 
      ? { href } 
      : { onClick, type: 'button' };
  
    return (
      <Component
        {...interactiveProps}
        className={`
          group
          relative
          cursor-pointer
          focus:outline-none
          focus:ring-2
          focus:ring-offset-2
          focus:ring-blue-500
          ${className}
        `}
        style={{
          width: dimensions.width,
          height: dimensions.height,
          margin: dimensions.margin,
        }}
        aria-label={ariaLabel}
        role={!href ? 'button' : undefined}
      >
        <div
          className="absolute inset-0 transition-colors duration-300 ease-in-out "
          style={{
            backgroundColor: color,
          }}
        />
        <div
          className="absolute w-0 transition-[border-color] duration-300 ease-in-out"
          style={{
            ...(variant === 'pointed' ? {
              bottom: '100%',
              borderLeft: `${dimensions.triangleWidth}px solid transparent`,
              borderRight: `${dimensions.triangleWidth}px solid transparent`,
              borderBottom: `${dimensions.triangleHeight}px solid ${color}`,
            } : {
              right: '100%',
              borderTop: `${dimensions.triangleWidth}px solid transparent`,
              borderBottom: `${dimensions.triangleWidth}px solid transparent`,
              borderRight: `${dimensions.triangleHeight}px solid ${color}`,
            })
          }}
        />
        <div
          className="absolute w-0 transition-[border-color] duration-300 ease-in-out"
          style={{
            ...(variant === 'pointed' ? {
              top: '100%',
              borderLeft: `${dimensions.triangleWidth}px solid transparent`,
              borderRight: `${dimensions.triangleWidth}px solid transparent`,
              borderTop: `${dimensions.triangleHeight}px solid ${color}`,
            } : {
              left: '100%',
              borderTop: `${dimensions.triangleWidth}px solid transparent`,
              borderBottom: `${dimensions.triangleWidth}px solid transparent`,
              borderLeft: `${dimensions.triangleHeight}px solid ${color}`,
            })
          }}
        />
        <div 
          className="
            relative 
            z-10 
            flex 
            items-center 
            justify-center 
            w-full 
            h-full 
            group-hover:text-white
            transition-colors
            duration-300
          "
          style={{
            overflowX: "auto",
            width: "100px",
            display: "flow",
            paddingLeft: "10px",
            paddingRight: "10px",
            alignContent: "center"
          }}
        >
          {children}
        </div>
  
        {/* Hover overlay */}
        <div
          className="
            absolute 
            inset-0 
            opacity-0 
            group-hover:opacity-100 
            transition-opacity 
            duration-300 
            z-0
          "
          style={{
            backgroundColor: hoverColor,
          }}
        />
        <div
          className="
            absolute 
            w-0 
            opacity-0 
            group-hover:opacity-100 
            transition-opacity 
            duration-300
          "
          style={{
            ...(variant === 'pointed' ? {
              bottom: '100%',
              borderLeft: `${dimensions.triangleWidth}px solid transparent`,
              borderRight: `${dimensions.triangleWidth}px solid transparent`,
              borderBottom: `${dimensions.triangleHeight}px solid ${hoverColor}`,
            } : {
              right: '100%',
              top: '0px',
              borderTop: `${dimensions.triangleWidth}px solid transparent`,
              borderBottom: `${dimensions.triangleWidth}px solid transparent`,
              borderRight: `${dimensions.triangleHeight}px solid ${hoverColor}`,
            })
          }}
        />
        <div
          className="
            absolute 
            w-0 
            opacity-0 
            group-hover:opacity-100 
            transition-opacity 
            duration-300
          "
          style={{
            ...(variant === 'pointed' ? {
              top: '100%',
              borderLeft: `${dimensions.triangleWidth}px solid transparent`,
              borderRight: `${dimensions.triangleWidth}px solid transparent`,
              borderTop: `${dimensions.triangleHeight}px solid ${hoverColor}`,
            } : {
              left: '100%',
              top: '0px',
              borderTop: `${dimensions.triangleWidth}px solid transparent`,
              borderBottom: `${dimensions.triangleWidth}px solid transparent`,
              borderLeft: `${dimensions.triangleHeight}px solid ${hoverColor}`,
            })
          }}
        />
      </Component>
    );
  };
  
  export default Hexagon;