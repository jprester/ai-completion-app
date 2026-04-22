export default function Star({ size = 14 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m12 2 2.9 6.9L22 10l-5.5 4.8L18 22l-6-3.4L6 22l1.5-7.2L2 10l7.1-1.1z" />
    </svg>
  );
}
