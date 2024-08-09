import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

function StreamingComponent() {
  const [streamedData, setStreamedData] = useState<string[]>([]);

  useEffect(() => {
    const startStreaming = async () => {
      // Listen for streaming data
      const unlisten = await listen('stream-data', (event) => {
        setStreamedData((prev) => [...prev, event.payload as string]);
      });

      // Invoke the Rust command to start streaming
      await invoke('stream_data');

      return unlisten;
    };

    startStreaming();

    // Cleanup listener on component unmount
    return () => {
      startStreaming().then((unlisten) => unlisten());
    };
  }, []);

  return (
    <div>
      <h2>Streamed Data:</h2>
      <ul>
        {streamedData.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

export default StreamingComponent;
