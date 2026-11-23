import React from 'react';
import { View, Text } from 'react-native';
import Sheet from '../../components/Sheet';
import { useX, Btn } from '../ui';

// גיליון אישור בצבעי עולם המבחן. כפתור ראשי אחד, וכפתור משני "לא עכשיו".
export default function ExamSheet({ visible, onClose, title, body, primary, onPrimary, secondary = 'ביטול', onSecondary, destructive, children }) {
  const { c, t } = useX();
  return (
    <Sheet visible={visible} onClose={onClose} bg={c.surface} grab={c.mist} scrim={c.scrim}>
      <Text style={[t.h3, { marginBottom: 8 }]}>{title}</Text>
      {body ? <Text style={[t.bodyDim, { marginBottom: 20 }]}>{body}</Text> : null}
      {children}
      <View style={{ gap: 10 }}>
        {primary ? <Btn label={primary} onPress={onPrimary} variant={destructive ? 'bad' : 'primary'} /> : null}
        {secondary ? <Btn label={secondary} onPress={onSecondary || onClose} variant="line" /> : null}
      </View>
    </Sheet>
  );
}
