import { createContext, useContext, useState } from 'react';

const ActionContext = createContext();

export function ActionProvider({ children }) {
  const [currentAction, setCurrentAction] = useState(null);
  const [actionCounter, setActionCounter] = useState(0);

  const triggerAction = (action) => {
    setCurrentAction(action);
    setActionCounter(prev => prev + 1);
  };

  return (
    <ActionContext.Provider value={{ 
      currentAction, 
      setCurrentAction: triggerAction,
      actionCounter 
    }}>
      {children}
    </ActionContext.Provider>
  );
}
 
export function useAction() {   
  return useContext(ActionContext); 
}