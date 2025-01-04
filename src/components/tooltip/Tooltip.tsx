import React from 'react';

type ToolTipProps = {
  children: React.ReactNode;
  text: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
};

const ToolTip = ({ children, text, position = 'right' }: ToolTipProps) => {
  return (
    <div className={`tooltip-container ${position}`}>
      <>
        {children}
        <span className="tooltip-text">{text}</span>
      </>
    </div>
  );
};

export default ToolTip;
