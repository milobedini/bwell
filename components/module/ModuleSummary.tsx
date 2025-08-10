import { View } from 'react-native';
import type { Module } from '@milobedini/shared-types';

import { ThemedText } from '../ThemedText';

type ModuleSummaryProps = {
  module: Module;
};

const ModuleSummary = ({ module }: ModuleSummaryProps) => {
  return (
    <View>
      <ThemedText type="title">{module.title}</ThemedText>
      <ThemedText type="subtitle" className="my-2">
        {module.program.title} Program
      </ThemedText>
      <ThemedText className="my-2">{module.description}</ThemedText>
      <ThemedText type="italic" className="my-2">
        {module.disclaimer}
      </ThemedText>
    </View>
  );
};

export default ModuleSummary;
