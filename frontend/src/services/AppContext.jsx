import React, { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [datasetResults, setDatasetResults] = useState(null);
  const [datasetConfig, setDatasetConfig] = useState({
    selectedTarget: "",
    selectedSensitive: [],
    gcsUri: "",
    fileId: "",
  });
  const [llmResults, setLlmResults] = useState(null);
  const [llmConfig, setLlmConfig] = useState({
    provider: "openai",
    model: "gpt-3.5-turbo",
    suite: "hiring"
  });
  const [modelResults, setModelResults] = useState(null);
  const [mitResult, setMitResult] = useState(null);

  return (
    <AppContext.Provider value={{
      datasetResults, setDatasetResults,
      datasetConfig, setDatasetConfig,
      llmResults, setLlmResults,
      llmConfig, setLlmConfig,
      modelResults, setModelResults,
      mitResult, setMitResult,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  return useContext(AppContext);
}