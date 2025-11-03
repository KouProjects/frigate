function CameraActivityIndicator() {
  return (
    <div className="relative z-20 flex items-center justify-center">
      <div className="flex">
        <div className="animate-move bg-severity_alert-dimmed absolute inset-0 z-20 size-[5px] rounded-full shadow-[0px_0px_10px_0px_#00000024,0px_0px_15px_0px_#00000024]"></div>
        <div className="animate-scale1 bg-severity_alert mr-[2px] size-[5px] flex-1 rounded-full"></div>
        <div className="animate-scale2 bg-severity_alert mr-[2px] size-[5px] flex-1 rounded-full"></div>
        <div className="animate-scale3 bg-severity_alert mr-[2px] size-[5px] flex-1 rounded-full"></div>
        <div className="animate-scale4 bg-severity_alert mr-[2px] size-[5px] flex-1 rounded-full"></div>
      </div>
      <svg className="hidden" xmlns="http://www.w3.org/2000/svg" version="1.1">
        <defs>
          <filter id="goo">
            <feGaussianBlur
              in="SourceGraphic"
              stdDeviation="10"
              result="blur"
            />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 18 -7"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>
    </div>
  );
}

export default CameraActivityIndicator;
