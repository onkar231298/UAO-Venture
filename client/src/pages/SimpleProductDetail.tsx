import { useParams } from "wouter";

export default function SimpleProductDetail() {
  const { slug } = useParams();
  
  console.log("SimpleProductDetail rendering with slug:", slug);
  
  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h1>Simple Product Detail Page</h1>
      <p>Product slug: {slug}</p>
      <p>This is a basic test to verify routing works.</p>
    </div>
  );
}