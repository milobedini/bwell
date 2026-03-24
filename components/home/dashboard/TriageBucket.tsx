import { forwardRef, memo } from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { DashboardClientItem } from '@milobedini/shared-types';

import ClientCard from './ClientCard';

type BucketType = 'attention' | 'completed' | 'inactive';

const BUCKET_CONFIG: Record<BucketType, { dotColor: string; label: string }> = {
  attention: { dotColor: Colors.primary.error, label: 'NEEDS ATTENTION' },
  completed: { dotColor: Colors.sway.bright, label: 'COMPLETED THIS WEEK' },
  inactive: { dotColor: Colors.sway.darkGrey, label: 'NO ACTIVITY' }
};

type TriageBucketProps = {
  type: BucketType;
  items: DashboardClientItem[];
};

const TriageBucket = memo(
  forwardRef<View, TriageBucketProps>(({ type, items }, ref) => {
    if (items.length === 0) return null;

    const config = BUCKET_CONFIG[type];

    return (
      <View ref={ref} className="mt-5">
        {/* Section header */}
        <View className="mb-2.5 flex-row items-center gap-2 py-1.5">
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: config.dotColor
            }}
          />
          <ThemedText
            type="small"
            style={{
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: 1,
              color: Colors.sway.darkGrey
            }}
          >
            {config.label}
          </ThemedText>
          <View
            style={{
              marginLeft: 'auto',
              backgroundColor: Colors.tint.neutral,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10
            }}
          >
            <ThemedText type="small" style={{ color: Colors.sway.darkGrey, fontSize: 12 }}>
              {items.length}
            </ThemedText>
          </View>
        </View>

        {/* Client cards */}
        {items.map((item) => (
          <ClientCard key={item.patient._id} item={item} />
        ))}
      </View>
    );
  })
);

TriageBucket.displayName = 'TriageBucket';

export default TriageBucket;
