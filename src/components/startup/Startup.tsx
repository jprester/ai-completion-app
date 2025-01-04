import FlashLogo from '../../assets/icons/FlashLogo';

export default function Startup() {
  return (
    <div className="startup-section">
      <h1 className="startup-title">
        <span className="startup-logo">
          <FlashLogo />
        </span>
        Welcome to SpeedyChat App
      </h1>
      <p className="mt-10">A simple and free LLM Chat Client optimised for clean and fast usage</p>
    </div>
  );
}
