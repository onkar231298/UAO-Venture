import React from "react";

export default function Test() {
  return (
    <div style={{padding: '20px', fontFamily: 'Arial'}}>
      <h1>Mobile Product Page Test</h1>
      <p>This is a test to verify React is rendering properly</p>
      <div style={{
        width: '100%',
        height: '200px',
        background: 'linear-gradient(135deg, #ffa500, #ff7f50)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '8px',
        color: 'white',
        fontSize: '18px',
        fontWeight: 'bold'
      }}>
        Mobile Test Success!
      </div>
    </div>
  );
}