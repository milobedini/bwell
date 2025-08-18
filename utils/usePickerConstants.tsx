import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

const usePickerConstants = () => {
  const { height: screenH } = useWindowDimensions();
  const verticalMargin = 36;
  const dialogHeight = (screenH - verticalMargin) * 0.8;

  return useMemo(() => {
    return {
      verticalMargin,
      dialogHeight
    };
  }, [dialogHeight]);
};

export default usePickerConstants;
