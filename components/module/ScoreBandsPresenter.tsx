import { View } from 'react-native';
import type { ScoreBand } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';

type ScoreBandsPresenterProps = {
  scoreBands: ScoreBand[];
};

const ScoreBandsPresenter = ({ scoreBands }: ScoreBandsPresenterProps) => {
  return (
    <View>
      <ThemedText type="subtitle" className="mb-2">
        Results meaning
      </ThemedText>
      {scoreBands.map((band) => (
        <View key={band._id} className="my-2 gap-2 border-b border-b-sway-lightGrey">
          <ThemedText>
            Score {band.min} to {band.max} - {band.label}
          </ThemedText>
          <ThemedText className="mb-2">{band.interpretation}</ThemedText>
        </View>
      ))}
    </View>
  );
};

export default ScoreBandsPresenter;
