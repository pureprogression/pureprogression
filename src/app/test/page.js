"use client";

export default function TestPage() {
  return (
    <div style={{ padding: '50px', background: 'black', color: 'white', minHeight: '100vh' }}>
      <h1>Test Page</h1>
      <p>If you see this, React is working!</p>
      <p>Time: {new Date().toLocaleTimeString()}</p>
    </div>
  );
}
