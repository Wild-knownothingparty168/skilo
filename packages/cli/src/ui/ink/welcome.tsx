import React, { useEffect } from 'react';
import { Box, Text, render, useApp } from 'ink';

function WelcomeScreen() {
  const { exit } = useApp();

  useEffect(() => {
    const timer = setTimeout(() => {
      exit();
    }, 16);

    return () => {
      clearTimeout(timer);
    };
  }, [exit]);

  return (
    <Box flexDirection="column">
      <Text bold color="cyanBright">
        Skilo
      </Text>
      <Text bold>Share, install, sync, and pack agent skills without repo setup.</Text>
      <Box marginTop={1} borderStyle="round" borderColor="cyan" paddingX={1} paddingY={0} flexDirection="column">
        <Text bold color="white">
          Start here
        </Text>
        <Text color="gray">Use one of these four flows. Everything else is secondary.</Text>
        <Box marginTop={1} flexDirection="column">
          <Text color="green">skilo share claude</Text>
          <Text color="green">skilo share ./my-skill</Text>
          <Text color="green">skilo add https://skilo.xyz/s/abc123</Text>
          <Text color="green">skilo sync claude opencode</Text>
          <Text color="green">skilo pack ./reviewer namespace/design-system</Text>
        </Box>
      </Box>
      <Box marginTop={1} borderStyle="round" borderColor="gray" paddingX={1} paddingY={0} flexDirection="column">
        <Text bold color="white">
          Inputs
        </Text>
        <Text color="gray">links, packs, refs, repos, bundles, or local tool sources</Text>
        <Box marginTop={1} flexDirection="column">
          <Text bold color="white">
            Agent entrypoints
          </Text>
          <Text color="gray">skilo --json</Text>
          <Text color="gray">https://skilo.xyz</Text>
          <Text color="gray">https://skilo.xyz/llms.txt</Text>
        </Box>
      </Box>
    </Box>
  );
}

export async function renderWelcomeScreen(): Promise<void> {
  const app = render(<WelcomeScreen />, {
    patchConsole: false,
    exitOnCtrlC: true,
  });

  await app.waitUntilExit();
}
