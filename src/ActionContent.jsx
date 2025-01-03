import { createContext, useContext, useState } from 'react';

const ActionContext = createContext();

export function ActionProvider({ children }) {
  const [currentAction, setCurrentAction] = useState(null);

  return (
    <ActionContext.Provider value={{ currentAction, setCurrentAction }}>
      {children}
    </ActionContext.Provider>
  );
}

export function useAction() {
  return useContext(ActionContext);
}