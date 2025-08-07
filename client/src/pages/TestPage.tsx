export default function TestPage() {
  console.log("TestPage component rendering...");
  
  return (
    <div style={{ 
      padding: '20px', 
      textAlign: 'center', 
      fontFamily: 'Arial, sans-serif',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      background: '#f9fafb'
    }}>
      <h1 style={{ color: '#111827', marginBottom: '20px' }}>Test Page Working!</h1>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>
        This confirms the React app is working correctly.
      </p>
      <a 
        href="/product/organic-curry-leaf-powder" 
        style={{ 
          background: '#f97316', 
          color: 'white', 
          padding: '12px 24px', 
          textDecoration: 'none', 
          borderRadius: '6px' 
        }}
      >
        Go to Product Page
      </a>
    </div>
  );
}