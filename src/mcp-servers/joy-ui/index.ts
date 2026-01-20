import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
    name: 'jellyfin-joy-ui',
    version: '1.0.0'
});

function createTool(name: string, description: string, schema: object, handler: Function) {
    // @ts-expect-error - SDK types are too strict for runtime use
    server.tool(name, description, schema, handler);
}

createTool(
    'get_joy_relationships',
    'Understand how Joy UI relates to other MCP servers',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    relatedMcpServers: [
                        {
                            server: 'components',
                            relationship: 'Joy UI provides styling for components',
                            direction: 'UI → Component',
                            integration: 'All new components use @mui/joy imports'
                        },
                        {
                            server: 'store-architecture',
                            relationship: 'Theme settings in settingsStore',
                            direction: 'Store → UI',
                            integration: 'settingsStore.ui.theme drives CSS variables'
                        },
                        {
                            server: 'api',
                            relationship: 'Forms submit via API',
                            direction: 'Component → API',
                            integration: 'SettingsForm → apiClient.updateUserConfiguration()'
                        },
                        {
                            server: 'architecture',
                            relationship: 'Joy UI is the theming system',
                            direction: 'Provides consistent styling across UI layer',
                            integration: 'CssVarsProvider with extendTheme'
                        }
                    ],
                    themeIntegration: [
                        {
                            source: 'settingsStore',
                            property: 'ui.theme',
                            target: 'Joy theme mode',
                            mapping: { dark: 'dark', light: 'light', system: 'system' }
                        },
                        {
                            source: 'settingsStore',
                            property: 'ui.animationsEnabled',
                            target: 'CSS animations',
                            mapping: { true: 'enabled', false: 'disabled' }
                        }
                    ],
                    componentUsage: [
                        {
                            components: 'Button, Chip, Stack, Box, Typography, Sheet, ModalDialog',
                            source: '@mui/joy',
                            purpose: 'Core UI components'
                        },
                        {
                            components: 'Alert, LinearProgress, CircularProgress, Skeleton, Snackbar',
                            source: '@mui/joy',
                            purpose: 'Feedback components'
                        },
                        {
                            components: 'Table, TableHead, TableBody, TableRow, TableCell',
                            source: '@mui/joy',
                            purpose: 'Data table components (used with TanStack Table)'
                        }
                    ],
                    formIntegration: [
                        {
                            pattern: 'Joy UI + Zod',
                            example: 'TextField with error/helperText from Zod validation',
                            file: 'src/components/forms/SettingsForm.tsx'
                        },
                        {
                            pattern: 'Joy UI + TanStack Query',
                            example: 'Form submit via mutateAsync()',
                            file: 'src/apps/dashboard/routes/users/add.tsx'
                        }
                    ],
                    migrationProgress: [
                        { phase: 'Foundation', complete: true, files: ['src/themes/joyTheme.tsx'] },
                        { phase: 'New Components', complete: true, files: ['QueueTable.tsx', 'SettingsForm.tsx'] },
                        { phase: 'Migration', inProgress: true, files: ['src/components/visualizer/'] },
                        { phase: 'Cleanup', pending: true, files: ['Remove @mui/material from deps'] }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_migration_overview',
    'Understand the migration path from Material UI to Joy UI for Jellyfin',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    migrationDecision: {
                        reason: 'Joy UI provides cleaner, lighter theming with CSS variables and easier customization',
                        benefits: [
                            'Built-in CSS variables for theming',
                            'Simpler component API',
                            'Lighter bundle size',
                            'Easier dark mode with color schemes',
                            'More flexible styling with sx prop',
                            'Better design system foundation'
                        ],
                        timeline: 'Gradual migration - new components use Joy UI, existing Material UI components migrated as needed'
                    },
                    jellyfinMigration: {
                        currentTheme: 'Material UI in src/themes/themes.ts',
                        newTheme: 'Joy UI in src/themes/joyTheme.tsx',
                        wrapperPattern: '<CssVarsProvider theme={joyTheme}>...</CssVarsProvider>',
                        rootIntegration: 'src/RootApp.tsx wraps app with JoyThemeProvider',
                        compatibility: 'Material UI and Joy UI can coexist during migration'
                    },
                    phase1: {
                        name: 'Foundation',
                        tasks: [
                            'Set up joyTheme.tsx with Jellyfin colors',
                            'Create JoyThemeProvider wrapper',
                            'Update RootApp.tsx to use JoyThemeProvider',
                            'Add @mui/joy to dependencies'
                        ]
                    },
                    phase2: {
                        name: 'New Components',
                        tasks: [
                            'All new components use Joy UI',
                            'VisualizerControls.tsx as example',
                            'Queue table with Joy UI components',
                            'Settings dialogs with Joy UI'
                        ]
                    },
                    phase3: {
                        name: 'Migration',
                        tasks: [
                            'Replace Material imports with Joy imports',
                            'Update sx prop color references',
                            'Migrate typography to Joy levels',
                            'Test dark mode thoroughly'
                        ]
                    },
                    phase4: {
                        name: 'Cleanup',
                        tasks: [
                            'Remove Material UI theme configuration',
                            'Remove @mui/material dependencies',
                            'Update MCP documentation',
                            'Final testing and polish'
                        ]
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_ui_overview',
    'Get overview of Joy UI and how it differs from Material UI',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    joyUiVsMaterial: [
                        {
                            aspect: 'Theming',
                            joy: 'CssVarsProvider with extendTheme, uses theme.vars.*',
                            material: 'ThemeProvider with createTheme, uses theme.palette.*'
                        },
                        {
                            aspect: 'Components',
                            joy: '@mui/joy/Button, @mui/joy/Stack',
                            material: '@mui/material/Button, @mui/material/Stack'
                        },
                        {
                            aspect: 'Styling',
                            joy: 'CSS variables, sx prop with theme.vars',
                            material: 'Theme tokens, sx prop with theme.palette'
                        },
                        {
                            aspect: 'Color Schemes',
                            joy: 'Built-in CSS variables, automatic dark mode',
                            material: 'Manual palette configuration'
                        },
                        {
                            aspect: 'Bundle Size',
                            joy: 'Smaller, more focused',
                            material: 'Larger, includes Material Design specs'
                        }
                    ],
                    joyUiStrengths: [
                        'Simpler theming with CSS variables',
                        'More flexible component customization',
                        'Built-in dark mode support',
                        'Lighter weight than Material UI',
                        'Easier to create custom design systems',
                        'Cleaner API surface'
                    ],
                    installation: 'npm install @mui/joy @emotion/react @emotion/styled'
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_ui_setup',
    'Understand how to set up Joy UI in Jellyfin',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    setupPattern: [
                        {
                            step: 'Import CssVarsProvider and extendTheme',
                            code: "import { CssVarsProvider, extendTheme } from '@mui/joy/styles';"
                        },
                        {
                            step: 'Create extended theme with Jellyfin colors',
                            code: `import { joyTheme } from 'themes/joyTheme';

// In your app:
<CssVarsProvider theme={joyTheme} defaultMode="dark">
  <App />
</CssVarsProvider>`
                        }
                    ],
                    jellyfinThemeIntegration: {
                        file: 'src/themes/joyTheme.tsx',
                        colors: {
                            primary: '#aa5c8f',
                            primaryDark: '#8a4a75',
                            background: '#101010',
                            surface: '#1a1a1a',
                            text: '#ffffff',
                            textSecondary: '#aaaaaa'
                        },
                        wrapper: 'JoyThemeProvider in src/themes/joyTheme.tsx'
                    },
                    rootIntegration: {
                        file: 'src/RootApp.tsx',
                        pattern: `<JoyThemeProvider>
  <RootAppRouter />
</JoyThemeProvider>`
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_component_usage',
    'Get examples of using Joy UI components in Jellyfin',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    buttonVariants: [
                        {
                            variant: 'solid',
                            usage: 'Primary actions, call-to-action',
                            example: '<Button variant="solid">Play</Button>'
                        },
                        {
                            variant: 'soft',
                            usage: 'Secondary actions, less emphasis',
                            example: '<Button variant="soft">Cancel</Button>'
                        },
                        {
                            variant: 'outlined',
                            usage: 'Tertiary actions, borders',
                            example: '<Button variant="outlined">More Info</Button>'
                        },
                        {
                            variant: 'plain',
                            usage: 'Text buttons, minimal visual',
                            example: '<Button variant="plain">Skip</Button>'
                        }
                    ],
                    commonComponents: [
                        {
                            component: 'Button',
                            usage: 'Playback controls, actions',
                            props: ['variant', 'color', 'size', 'disabled', 'startDecorator', 'endDecorator']
                        },
                        {
                            component: 'Chip',
                            usage: 'Tags, filters, status indicators',
                            props: ['variant', 'color', 'size', 'onClick', 'onDelete']
                        },
                        {
                            component: 'Stack',
                            usage: 'Layout spacing between elements',
                            props: ['spacing', 'direction', 'useFlexGap']
                        },
                        {
                            component: 'Box',
                            usage: 'Generic container with sx prop',
                            props: ['component', 'sx']
                        },
                        {
                            component: 'Typography',
                            usage: 'Text with consistent styling',
                            props: ['level', 'component', 'sx']
                        },
                        {
                            component: 'Sheet',
                            usage: 'Card-like containers, sections',
                            props: ['variant', 'color', 'sx']
                        },
                        {
                            component: 'ModalDialog',
                            usage: 'Dialogs, modals, alerts',
                            props: ['open', 'onClose', 'title', 'description']
                        }
                    ],
                    jellyfinExamples: [
                        {
                            useCase: 'Now Playing controls',
                            code: `<Stack spacing={1} direction="row" useFlexGap>
  <Button variant="plain" size="sm">
    <SkipPrevious />
  </Button>
  <Button variant="solid" color="primary" onClick={togglePlay}>
    {isPlaying ? <Pause /> : <PlayArrow />}
  </Button>
  <Button variant="plain" size="sm">
    <SkipNext />
  </Button>
</Stack>`
                        },
                        {
                            useCase: 'Queue item chip',
                            code: `<Chip 
  variant={isCurrent ? "solid" : "soft"} 
  color={isCurrent ? "primary" : "neutral"}
  onClick={() => playItem(item.id)}
>
  {item.name}
</Chip>`
                        },
                        {
                            useCase: 'Visualizer toggle sheet',
                            code: `<Sheet variant="outlined" sx={{ p: 2 }}>
  <Typography level="body-sm">Visualizer Type</Typography>
  <Stack spacing={1}>
    <Button 
      variant={type === "waveform" ? "solid" : "plain"}
      onClick={() => setType("waveform")}
    >
      Waveform
    </Button>
  </Stack>
</Sheet>`
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_styling_patterns',
    'Understand Joy UI styling patterns and CSS variable usage',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    cssVariables: [
                        {
                            usage: 'Color palette',
                            syntax: 'theme.vars.palette.primary.main',
                            example: 'backgroundColor: theme.vars.palette.primary[500]'
                        },
                        {
                            usage: 'Spacing',
                            syntax: 'theme.vars.spacing',
                            example: 'padding: theme.spacing(2)'
                        },
                        {
                            usage: 'Typography',
                            syntax: 'theme.vars.fontSize',
                            example: 'fontSize: theme.vars.fontSize.lg'
                        },
                        {
                            usage: 'Border radius',
                            syntax: 'theme.vars.radius',
                            example: 'borderRadius: theme.vars.radius.sm'
                        },
                        {
                            usage: 'Shadows',
                            syntax: 'theme.vars.shadow',
                            example: 'boxShadow: theme.vars.shadow.md'
                        }
                    ],
                    sxProp: [
                        {
                            description: 'Shorthand for inline styles',
                            example: '<Button sx={{ backgroundColor: "primary.main", borderRadius: 2 }}>'
                        },
                        {
                            description: 'With theme variables',
                            example: '<Box sx={{ p: 2, backgroundColor: "background.surface" }}>'
                        },
                        {
                            description: 'Responsive values',
                            example: '<Box sx={{ width: { xs: "100%", md: "50%" } }}>'
                        },
                        {
                            description: 'Pseudo-classes',
                            example: '<Button sx={{ "&:hover": { backgroundColor: "primary.dark" } }}>'
                        }
                    ],
                    styledPattern: [
                        {
                            description: 'Creating custom Joy components',
                            code: `import { styled } from '@mui/joy/styles';

const VisualizerContainer = styled('div')(({ theme }) => ({
  backgroundColor: theme.vars.palette.background.surface,
  borderRadius: theme.vars.radius.md,
  padding: theme.spacing(2),
  boxShadow: theme.vars.shadow.sm,
}));

const ControlButton = styled('button')(({ theme }) => ({
  backgroundColor: theme.vars.palette.primary.main,
  border: 'none',
  borderRadius: theme.vars.radius.sm,
  padding: theme.spacing(1, 2),
  cursor: 'pointer',
  "&:hover": {
    backgroundColor: theme.vars.palette.primary.dark,
  }
}));`
                        }
                    ],
                    colorSchemeIntegration: [
                        {
                            description: 'Automatic dark mode support',
                            code: `const theme = extendTheme({
  colorSchemes: {
    light: { palette: { primary: { main: '#aa5c8f' } } },
    dark: { palette: { primary: { main: '#c48b9f' } } }
  }
});`
                        },
                        {
                            description: 'Manual color scheme switching',
                            code: `import { useColorScheme } from '@mui/joy/styles';

function ThemeToggle() {
  const { mode, setMode } = useColorScheme();
  return <Button onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}>
    {mode === 'dark' ? 'Light' : 'Dark'}
  </Button>;
}`
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_migration_checklist',
    'Get a step-by-step checklist for migrating Material UI to Joy UI',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    migrationChecklist: [
                        {
                            phase: 'Setup',
                            steps: [
                                'npm install @mui/joy @emotion/react @emotion/styled',
                                'Create src/themes/joyTheme.tsx with Jellyfin colors',
                                'Add JoyThemeProvider wrapper in RootApp.tsx',
                                'Verify build works with Joy UI dependencies'
                            ]
                        },
                        {
                            phase: 'Component Migration',
                            steps: [
                                'Import from @mui/joy instead of @mui/material',
                                'Replace theme.palette.* with theme.vars.palette.* in sx props',
                                'Update Typography level prop (h1 -> title-lg, body1 -> body-md)',
                                'Replace Button contained/outlined variants with solid/outlined',
                                'Use Stack with useFlexGap instead of Grid for layouts'
                            ]
                        },
                        {
                            phase: 'Theme Cleanup',
                            steps: [
                                'Update color scheme definitions in joyTheme',
                                'Configure component style overrides',
                                'Test dark mode with CSS variables',
                                'Verify all custom colors map correctly'
                            ]
                        },
                        {
                            phase: 'Finalization',
                            steps: [
                                'Remove unused Material UI imports',
                                'Update documentation to reflect Joy UI usage',
                                'Run full test suite',
                                'Monitor bundle size improvement'
                            ]
                        }
                    ],
                    importChanges: [
                        {
                            old: "import Button from '@mui/material/Button';",
                            new: "import Button from '@mui/joy/Button';"
                        },
                        {
                            old: "import Stack from '@mui/material/Stack';",
                            new: "import Stack from '@mui/joy/Stack';"
                        },
                        {
                            old: "import Box from '@mui/material/Box';",
                            new: "import Box from '@mui/joy/Box';"
                        },
                        {
                            old: "import Typography from '@mui/material/Typography';",
                            new: "import Typography from '@mui/joy/Typography';"
                        },
                        {
                            old: "import Sheet from '@mui/material/Paper';",
                            new: "import Sheet from '@mui/joy/Sheet';"
                        }
                    ],
                    themeChanges: [
                        {
                            old: "import { createTheme, ThemeProvider } from '@mui/material/styles';",
                            new: "import { CssVarsProvider, extendTheme } from '@mui/joy/styles';"
                        },
                        {
                            old: "theme.palette.primary.main",
                            new: "theme.vars.palette.primary.main"
                        },
                        {
                            old: "theme.palette.background.default",
                            new: "theme.vars.palette.background.body"
                        },
                        {
                            old: "sx={{ color: theme.palette.primary.main }}",
                            new: "sx={{ color: 'primary.main' }}"
                        }
                    ],
                    typographyChanges: [
                        {
                            old: '<Typography variant="h4">',
                            new: '<Typography level="title-lg">'
                        },
                        {
                            old: '<Typography variant="body1">',
                            new: '<Typography level="body-md">'
                        },
                        {
                            old: '<Typography variant="caption">',
                            new: '<Typography level="body-sm">'
                        }
                    ],
                    commonIssues: [
                        {
                            issue: 'Colors not applying',
                            fix: 'Use theme.vars.palette.* instead of theme.palette.*'
                        },
                        {
                            issue: 'Dark mode not working',
                            fix: 'Ensure colorSchemes are defined in extendTheme and CssVarsProvider has defaultMode'
                        },
                        {
                            issue: 'Spacing inconsistent',
                            fix: 'Use theme.spacing() function or numeric values in sx'
                        },
                        {
                            issue: 'Typography levels wrong',
                            fix: 'Use level prop (title-lg, body-md, etc.) instead of variant'
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_jellyfin_patterns',
    'Get Jellyfin-specific Joy UI patterns and conventions',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    jellyfinColors: {
                        primary: '#aa5c8f',
                        primaryDark: '#8a4a75',
                        background: '#101010',
                        surface: '#1a1a1a',
                        text: '#ffffff',
                        textSecondary: '#aaaaaa'
                    },
                    jellyfinTypography: {
                        h1: 'title-lg',
                        h2: 'title-md',
                        h3: 'title-sm',
                        body: 'body-md',
                        caption: 'body-sm'
                    },
                    jellyfinComponents: [
                        {
                            name: 'NowPlayingControls',
                            pattern: 'Stack with direction="row", useFlexGap, size="sm" buttons',
                            example: '<Stack spacing={1} direction="row" useFlexGap>'
                        },
                        {
                            name: 'VisualizerToggle',
                            pattern: 'Sheet with variant="outlined", typography for label',
                            example: '<Sheet variant="outlined"><Typography>Type</Typography></Sheet>'
                        },
                        {
                            name: 'QueueItem',
                            pattern: 'Chip with variant={isCurrent ? "solid" : "soft"}',
                            example: '<Chip variant={active ? "solid" : "soft"}>{name}</Chip>'
                        },
                        {
                            name: 'SettingsDialog',
                            pattern: 'ModalDialog with Sheet content',
                            example: '<ModalDialog><Sheet variant="plain">...</Sheet></ModalDialog>'
                        }
                    ],
                    jellyfinTheme: {
                        file: 'src/themes/joyTheme.tsx',
                        pattern: `const joyTheme = extendTheme({
  colorSchemes: {
    light: { palette: { primary: { 500: jellyfinPrimary } } },
    dark: { palette: { primary: { 500: jellyfinPrimary } } }
  },
  components: {
    JoyButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: theme.vars.radius.sm
        })
      }
    }
  }
});`
                    }
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_new_component_pattern',
    'Get a template for creating a new Joy UI component in Jellyfin',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    template: `import Box from '@mui/joy/Box';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';
import Typography from '@mui/joy/Typography';
import Sheet from '@mui/joy/Sheet';
import React from 'react';

interface Props {
  title: string;
  onAction: () => void;
  disabled?: boolean;
}

export function MyComponent({ title, onAction, disabled }: Props) {
  return (
    <Sheet variant="outlined" sx={{ p: 2, borderRadius: 'md' }}>
      <Typography level="title-md">{title}</Typography>
      <Stack spacing={1} direction="row" useFlexGap>
        <Button 
          variant="solid" 
          color="primary"
          onClick={onAction}
          disabled={disabled}
        >
          Action
        </Button>
      </Stack>
    </Sheet>
  );
}

export default MyComponent;`
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_form_patterns',
    'Understand Joy UI form patterns with Zod validation',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    formComponents: [
                        {
                            component: 'TextField',
                            purpose: 'Text input with validation',
                            props: ['label', 'required', 'error', 'helperText', 'type', 'size'],
                            example: '<TextField label="Username" required error={!!errors.username} helperText={errors.username} />'
                        },
                        {
                            component: 'Checkbox',
                            purpose: 'Boolean toggle',
                            props: ['checked', 'onChange', 'label', 'disabled'],
                            example: '<Checkbox checked={form.enabled} onChange={e => setForm({ enabled: e.target.checked })} label="Enable" />'
                        },
                        {
                            component: 'Select',
                            purpose: 'Dropdown selection',
                            props: ['value', 'onChange', 'options', 'placeholder'],
                            example: '<Select value={form.type} onChange={(_, v) => setForm({ type: v })}><Option value="audio">Audio</Option></Select>'
                        },
                        {
                            component: 'Slider',
                            purpose: 'Numeric range input',
                            props: ['value', 'onChange', 'min', 'max', 'step'],
                            example: '<Slider value={form.volume} onChange={(_, v) => setForm({ volume: v })} min={0} max={100} />'
                        }
                    ],
                    zodSchemas: [
                        {
                            name: 'User Form',
                            code: `import { z } from 'zod';

const userSchema = z.object({
    username: z.string().min(1, 'Username is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(['user', 'admin', 'editor']),
    enabled: z.boolean(),
});`
                        },
                        {
                            name: 'Settings Form',
                            code: `const settingsSchema = z.object({
    volume: z.number().min(0).max(100),
    crossfadeDuration: z.number().min(0).max(30),
    autoPlay: z.boolean(),
    visualizerType: z.enum(['waveform', 'frequency', 'butterchurn']),
});`
                        }
                    ],
                    formPattern: [
                        {
                            name: 'Full form implementation',
                            code: `import { useState } from 'react';
import { z } from 'zod';
import TextField from '@mui/joy/TextField';
import Button from '@mui/joy/Button';
import Stack from '@mui/joy/Stack';

const schema = z.object({
    username: z.string().min(1, 'Required'),
    email: z.string().email('Invalid email'),
});

export function UserForm() {
    const [form, setForm] = useState({ username: '', email: '' });
    const [errors, setErrors] = useState({});
    
    const validate = () => {
        const result = schema.safeParse(form);
        if (!result.success) {
            const formatted = {};
            result.error.issues.forEach(issue => {
                formatted[issue.path[0]] = issue.message;
            });
            setErrors(formatted);
            return false;
        }
        setErrors({});
        return true;
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;
        
        await saveUser(form);
    };
    
    return (
        <form onSubmit={handleSubmit}>
            <Stack spacing={2}>
                <TextField
                    label="Username"
                    value={form.username}
                    onChange={e => setForm({ ...form, username: e.target.value })}
                    error={!!errors.username}
                    helperText={errors.username}
                />
                <TextField
                    label="Email"
                    type="email"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    error={!!errors.email}
                    helperText={errors.email}
                />
                <Button type="submit" variant="solid">Save</Button>
            </Stack>
        </form>
    );
}`
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_table_patterns',
    'Understand Joy UI table patterns with TanStack Table',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    tableComponents: [
                        {
                            component: 'Table',
                            purpose: 'Main table container',
                            props: ['hoverRow', 'stripe', 'borderAxis']
                        },
                        {
                            component: 'TableHead',
                            purpose: 'Header row container'
                        },
                        {
                            component: 'TableBody',
                            purpose: 'Body rows container'
                        },
                        {
                            component: 'TableRow',
                            purpose: 'Row container',
                            props: ['hover', 'selected', 'color']
                        },
                        {
                            component: 'TableCell',
                            purpose: 'Cell content',
                            props: ['align', 'headers', 'scope']
                        }
                    ],
                    tablePattern: [
                        {
                            name: 'Basic table with TanStack',
                            code: `import Table from '@mui/joy/Table';
import { useReactTable, getCoreRowModel } from '@tanstack/react-table';

const columns = [
    { accessorKey: 'name', header: 'Name' },
    { accessorKey: 'artist', header: 'Artist' },
    { accessorKey: 'duration', header: 'Duration' },
];

const table = useReactTable({
    data: items,
    columns,
    getCoreRowModel: getCoreRowModel(),
});

return (
    <Table hoverRow stripe>
        <TableHead>
            {table.getHeaderGroups().map(headerGroup => (
                <TableRow key={headerGroup.id}>
                    {headerGroup.headers.map(header => (
                        <TableCell key={header.id}>{header.column.columnDef.header}</TableCell>
                    ))}
                </TableRow>
            ))}
        </TableHead>
        <TableBody>
            {table.getRowModel().rows.map(row => (
                <TableRow key={row.id}>
                    {row.getVisibleCells().map(cell => (
                        <TableCell key={cell.id}>
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                    ))}
                </TableRow>
            ))}
        </TableBody>
    </Table>
);`
                        },
                        {
                            name: 'Table with row actions',
                            code: `import Menu from '@mui/joy/Menu';
import MenuButton from '@mui/joy/MenuButton';
import MenuItem from '@mui/joy/MenuItem';

<TableCell align="right">
    <Menu>
        <MenuButton variant="plain" size="sm">Actions</MenuButton>
        <Menu>
            <MenuItem onClick={() => play(row.original)}>Play</MenuItem>
            <MenuItem onClick={() => addToQueue(row.original)}>Add to Queue</MenuItem>
            <MenuItem onClick={() => remove(row.original)}>Remove</MenuItem>
        </Menu>
    </Menu>
</TableCell>`
                        }
                    ],
                    tableFeatures: [
                        'Virtualization with @tanstack/react-virtual',
                        'Drag-and-drop with @dnd-kit',
                        'Sort/filter with TanStack Table',
                        'Row selection with checkboxes'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_modal_patterns',
    'Understand Joy UI modal and dialog patterns',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    modalComponents: [
                        {
                            component: 'Modal',
                            purpose: 'Base modal overlay',
                            props: ['open', 'onClose', 'disableAutoFocus', 'keepMounted']
                        },
                        {
                            component: 'ModalDialog',
                            purpose: 'Modal content container',
                            props: ['layout', 'size', 'color']
                        },
                        {
                            component: 'ModalClose',
                            purpose: 'Close button',
                            props: ['variant', 'color']
                        },
                        {
                            component: 'DialogTitle',
                            purpose: 'Modal title',
                            props: ['id', 'component']
                        },
                        {
                            component: 'DialogContent',
                            purpose: 'Modal body',
                            props: ['divided']
                        }
                    ],
                    dialogPatterns: [
                        {
                            name: 'Simple Dialog',
                            code: `<Dialog open={open} onClose={() => setOpen(false)}>
    <ModalDialog>
        <ModalClose />
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
            <Typography>Are you sure you want to delete this item?</Typography>
        </DialogContent>
        <DialogActions>
            <Button variant="plain" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="solid" color="danger" onClick={handleDelete}>Delete</Button>
        </DialogActions>
    </ModalDialog>
</Dialog>`
                        },
                        {
                            name: 'Form Dialog',
                            code: `<Dialog open={open} onClose={() => setOpen(false)}>
    <ModalDialog layout="center">
        <ModalClose />
        <DialogTitle>Edit Settings</DialogTitle>
        <DialogContent>
            <Stack spacing={2}>
                <TextField label="Volume" value={settings.volume} onChange={e => update('volume', e.target.value)} />
                <TextField label="Name" value={settings.name} onChange={e => update('name', e.target.value)} />
            </Stack>
        </DialogContent>
        <DialogActions>
            <Button variant="plain" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="solid" onClick={handleSave}>Save</Button>
        </DialogActions>
    </ModalDialog>
</Dialog>`
                        },
                        {
                            name: 'Full-screen Dialog',
                            code: `<Dialog open={open} onClose={() => setOpen(false)}>
    <ModalDialog layout="fullscreen">
        <ModalClose variant="outlined" />
        <DialogTitle>Now Playing</DialogTitle>
        <DialogContent>
            <QueueTable />
        </DialogContent>
    </ModalDialog>
</Dialog>`
                        }
                    ],
                    dialogSizes: [
                        { size: 'sm', maxWidth: '300px' },
                        { size: 'md', maxWidth: '400px' },
                        { size: 'lg', maxWidth: '600px' },
                        { size: 'xl', maxWidth: '800px' }
                    ],
                    dialogLayouts: [
                        'center - Centered modal',
                        'fullscreen - Full screen overlay',
                        'fullscreen-sm - Full screen below sm breakpoint'
                    ]
                }, null, 2)
            }]
        };
    }
);

createTool(
    'get_joy_feedback_patterns',
    'Understand Joy UI feedback components (alerts, toasts, progress)',
    { _dummy: z.literal(0).optional() },
    async () => {
        return {
            content: [{
                type: 'text',
                text: JSON.stringify({
                    feedbackComponents: [
                        {
                            component: 'Alert',
                            purpose: 'Status messages and notifications',
                            variants: ['solid', 'soft', 'outlined'],
                            colors: ['primary', 'neutral', 'danger', 'warning', 'success'],
                            props: ['startDecorator', 'endDecorator', 'size']
                        },
                        {
                            component: 'LinearProgress',
                            purpose: 'Progress indicator',
                            determinate: true,
                            variants: ['soft', 'solid'],
                            props: ['value', 'size', 'thickness']
                        },
                        {
                            component: 'CircularProgress',
                            purpose: 'Loading spinner',
                            size: 'sm | md | lg',
                            determinate: true,
                            props: ['value', 'determinate', 'size']
                        },
                        {
                            component: 'Skeleton',
                            purpose: 'Loading placeholder',
                            variants: ['text', 'circular', 'rectangular'],
                            props: ['animation', 'width', 'height']
                        }
                    ],
                    feedbackPatterns: [
                        {
                            name: 'Alert with action',
                            code: `<Alert color="success" startDecorator={<CheckCircle />}>
    Settings saved successfully!
    <AlertSlots.CloseButton />
</Alert>`
                        },
                        {
                            name: 'Loading state',
                            code: `{isLoading ? (
    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress size="lg" />
    </Box>
) : (
    <Content />
)}`
                        },
                        {
                            name: 'Progress bar',
                            code: `<LinearProgress 
    determinate 
    value={progress} 
    color="primary"
    size="sm" 
    thickness={4} 
/>`
                        },
                        {
                            name: 'Skeleton loader',
                            code: `<Stack spacing={2}>
    <Skeleton variant="text" width="40%" />
    <Skeleton variant="text" width="60%" />
    <Skeleton variant="rectangular" height={100} />
</Stack>`
                        }
                    ],
                    toastPattern: [
                        {
                            name: 'Toast with Snackbar',
                            code: `import Snackbar from '@mui/joy/Snackbar';

const [toast, setToast] = useState({ open: false, message: '', color: 'neutral' });

const showSuccess = (message) => {
    setToast({ open: true, message, color: 'success' });
};

return (
    <Snackbar
        open={toast.open}
        onClose={() => setToast({ ...toast, open: false })}
        color={toast.color}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
        {toast.message}
    </Snackbar>
);`
                        }
                    ]
                }, null, 2)
            }]
        };
    }
);

server.resource(
    'joy-ui-docs',
    'jellyfin://joy-ui/overview',
    async () => {
        return {
            contents: [{
                uri: 'jellyfin://joy-ui/overview',
                mimeType: 'text/markdown',
                text: `# Joy UI in Jellyfin

## Migration Status

**Phase 1: Foundation** - In Progress

Jellyfin is migrating from Material UI to Joy UI for a cleaner, more flexible theming system.

## Why Joy UI?

- Built-in CSS variables for theming
- Lighter bundle size
- Easier dark mode support
- Cleaner component API
- Better design system foundation

## Quick Start

\`\`\`bash
npm install @mui/joy @emotion/react @emotion/styled
\`\`\`

## Theme Setup

\`\`\`typescript
// src/themes/joyTheme.tsx
import { CssVarsProvider, extendTheme } from '@mui/joy/styles';

const theme = extendTheme({
  colorSchemes: {
    light: { palette: { primary: { 500: '#aa5c8f' } } },
    dark: { palette: { primary: { 500: '#aa5c8f' } } }
  }
});

function App() {
  return (
    <CssVarsProvider theme={theme} defaultMode="dark">
      <YourApp />
    </CssVarsProvider>
  );
}
\`\`\`

## Root Integration

\`\`\`typescript
// src/RootApp.tsx
import { JoyThemeProvider } from 'themes/joyTheme';

function RootApp() {
  return (
    <JoyThemeProvider>
      <RootAppRouter />
    </JoyThemeProvider>
  );
}
\`\`\`

## Component Migration

### Before (Material UI)
\`\`\`typescript
import Button from '@mui/material/Button';
<Typography variant="h4">Title</Typography>
<Button variant="contained">Click</Button>
\`\`\`

### After (Joy UI)
\`\`\`typescript
import Button from '@mui/joy/Button';
<Typography level="title-lg">Title</Typography>
<Button variant="solid">Click</Button>
\`\`\`

## Common Components

| Component | Import | Key Props |
|-----------|--------|-----------|
| Button | @mui/joy/Button | variant, color, size, startDecorator |
| Chip | @mui/joy/Chip | variant, color, onClick |
| Stack | @mui/joy/Stack | spacing, direction, useFlexGap |
| Box | @mui/joy/Box | component, sx |
| Sheet | @mui/joy/Sheet | variant, color, sx |
| Typography | @mui/joy/Typography | level, component, sx |

## Files
- \`src/themes/joyTheme.tsx\` - Jellyfin Joy theme configuration
- \`src/components/visualizer/VisualizerControls.tsx\` - Example Joy UI component
- \`src/mcp-servers/joy-ui/\` - Joy UI MCP server for development guidance

## Migration Phases

1. **Foundation** - Set up theme and provider
2. **New Components** - All new components use Joy UI
3. **Migration** - Gradually migrate existing components
4. **Cleanup** - Remove Material UI dependencies
`
            }]
        };
    }
);

const transport = new StdioServerTransport();
await server.connect(transport);
