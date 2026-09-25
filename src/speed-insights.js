import { injectSpeedInsights } from '@vercel/speed-insights';
import { isPortfolioEmbed } from './embed-mode.js';

if (!isPortfolioEmbed) injectSpeedInsights();
