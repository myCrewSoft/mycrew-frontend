interface Props {
  message?: string;
}

export default function ErrorMessage({ message }: Props) {
  if (!message) return null;
  return (
    <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>
      {message}
    </p>
  );
}