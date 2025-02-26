import React, { useState, useEffect, useRef } from "react";

function LogPanel() {
  const [logs, setLogs] = useState([]);
  const lastLogRef = useRef(null);

  useEffect(() => {
    const originalLog = console.log;
    const originalError = console.error;

    // Override console.log
    console.log = (...args) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [
        ...prev,
        { message: args.join(" "), timestamp, type: "log" },
      ]);
      originalLog.apply(console, args);
    };

    // Override console.error
    console.error = (...args) => {
      const timestamp = new Date().toLocaleTimeString();
      setLogs((prev) => [
        ...prev,
        { message: args.join(" "), timestamp, type: "error" },
      ]);
      originalError.apply(console, args);
    };

    // Cleanup: Restore original functions
    return () => {
      console.log = originalLog;
      console.error = originalError;
    };
  }, []);

  // Scroll to the last log whenever logs update
  useEffect(() => {
    if (lastLogRef.current) {
      lastLogRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [logs]);

  return (
    <div
      style={{
        border: "1px solid #ccc",
        padding: "10px",
        maxHeight: "100px",
        overflowY: "auto",
        margin: "10px 0",
      }}
    >
      <h3>Activity Log</h3>
      {logs.length === 0 ? (
        <p>No logs yet.</p>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {logs.map((log, index) => (
            <li
              key={index}
              ref={index === logs.length - 1 ? lastLogRef : null}
              style={{
                marginBottom: "5px",
                color: log.type === "error" ? "red" : "inherit", // Highlight errors in red
              }}
            >
              <span style={{ color: "#888", marginRight: "10px" }}>
                {log.timestamp}
              </span>
              {log.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default LogPanel;
