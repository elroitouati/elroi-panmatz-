import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { createNavigationContainerRef } from '@react-navigation/native';
import Sheet from '../components/Sheet';
import Button from '../components/Button';
import { text } from '../design/typography';
import { space } from '../design/tokens';
import { haptic } from '../design/haptics';
import { useToday } from './ExamContext';

// ============================================================================
//  השער לעולם המבחן: גיליון אישור בצבעי פנמ"צ ("עוברים למצב מבחן?").
//  נפתח מהטאב "מבחן", מכרטיס המשימות בדף הבית ומהמסך של הטאב.
//  כשהגיליון פתוח, עולם הזית נדחף לאחור (SheetHost) — וב"כניסה" העולם
//  הכחול עולה מעליו.
// ============================================================================

export const navRef = createNavigationContainerRef();
const Ctx = createContext({ open: () => {} });

export function GateProvider({ children }) {
  const [visible, setVisible] = useState(false);
  const day = useToday();
  const open = useCallback(() => { haptic.selection(); setVisible(true); }, []);
  const enter = () => {
    setVisible(false);
    haptic.light();
    if (navRef.isReady()) navRef.navigate('Exam');
  };
  const line = !day ? '' : day.off ? 'היום יום חופש מהמבחן.' : day.total && day.finished === day.total ? 'כל המשימות של היום הושלמו.' : `היום: ${day.finished} מתוך ${day.total} משימות.`;
  return (
    <Ctx.Provider value={{ open }}>
      {children}
      <Sheet visible={visible} onClose={() => setVisible(false)}>
        <Text style={[text.title, { marginBottom: space[2] }]}>עוברים למצב מבחן?</Text>
        <Text style={[text.bodyDim, { marginBottom: space[5] }]}>עולם נפרד ללימוד לפסיכוטכני. {line} חוזרים לפנמ״צ בכל רגע מהכפתור למעלה.</Text>
        <View style={{ gap: space[3] }}>
          <Button label="כניסה" icon="arrow-back" variant="primary" onPress={enter} />
          <Button label="לא עכשיו" variant="plain" onPress={() => setVisible(false)} />
        </View>
      </Sheet>
    </Ctx.Provider>
  );
}

export const useGate = () => useContext(Ctx);
