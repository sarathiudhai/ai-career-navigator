import { useState } from 'react';

const SimpleLoginTest = () => {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    setResult('Testing...');
    
    try {
      console.log('Starting login test...');
      
      const response = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'learner@example.com',
          password: 'pass123'
        })
      });

      console.log('Response received:', response.status);
      
      const data = await response.json();
      console.log('Response data:', data);
      
      setResult(`Status: ${response.status}\nData: ${JSON.stringify(data, null, 2)}`);
      
    } catch (error) {
      console.error('Error:', error);
      setResult(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testHealth = async () => {
    setLoading(true);
    setResult('Testing health...');
    
    try {
      const response = await fetch('http://localhost:8000/health');
      const data = await response.json();
      setResult(`Health OK: ${JSON.stringify(data)}`);
    } catch (error) {
      setResult(`Health Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Login Debug Test</h1>
      
      <div className="space-x-4 mb-4">
        <button 
          onClick={testHealth}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Test Health
        </button>
        
        <button 
          onClick={testLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Test Login
        </button>
      </div>
      
      {loading && <p>Loading...</p>}
      
      <div className="mt-4 p-4 bg-gray-100 rounded">
        <pre className="whitespace-pre-wrap">{result}</pre>
      </div>
    </div>
  );
};

export default SimpleLoginTest;
