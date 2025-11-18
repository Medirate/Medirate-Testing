import clsx from "clsx";

interface LoaderOverlayProps {
  label?: string;
  className?: string;
}

export default function LoaderOverlay({ label = "loading", className }: LoaderOverlayProps) {
  return (
    <div className={clsx("loader-overlay", className)}>
      <div className="cssloader">
        <div className="sh1"></div>
        <div className="sh2"></div>
        <h4 className="lt">{label}</h4>
      </div>
    </div>
  );
}

