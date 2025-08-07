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
      <ThemedText type="subtitle">{module.program.title} Program</ThemedText>
      <ThemedText>{module.description}</ThemedText>
      <ThemedText type="italic">{module.disclaimer}</ThemedText>
    </View>
  );
};

export default ModuleSummary;
