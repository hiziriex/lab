import '@radix-ui/themes/styles.css';
import type { Preview } from '@storybook/react-vite';
import { SystemTheme } from '../src/components/ui/SystemTheme';
import '../src/styles/global.css';
const preview: Preview = {
  decorators: [
    (Story) => (
      <SystemTheme>
        <Story />
      </SystemTheme>
    ),
  ],
};
export default preview;
