import { Illuminsight } from 'types/illuminsight';
import { stopwords } from 'lib/reader/stopwords';
import wtf from 'wtf_wikipedia';

const REGEX = /(?:[^.\s!?])\s+((?:[A-Z][-A-Za-z']*(?: *[A-Z][-A-Za-z']*)*))|(?:[^.\s!?])\s+([A-Z][-A-Za-z']*)/gm;

/**
 * @todo Manual parsing?
 * - Split by space
 * - Loop through, building phrases
 * - `-` is connector
 * - ` of ` and similar are connectors
 * - `!` and `?` are hard separators
 * - `.` is hard separator unless previous word was single cap letter
 * - Throw out first cap word after hard separator if it's a stopword
 * - Generated nested insights where we're unsure which words to include
 * @todo Use full content to guide parser for paragraph
 */

/**
 * Generate insights from provided text content.
 */
export async function generateInsights(
  text: string,
  /**
   * Was `text` sourced from a user highlight?
   */
  highlight: boolean = false
): Promise<Illuminsight.Insight[]> {
  const insights: Illuminsight.Insight[] = highlight
    ? [{ text }]
    : Array.from(
        // Removes duplicates
        new Set(
          // Grab anything that looks like a proper noun (English mainly)
          (text.match(REGEX) || [])
            .map(item => item.substr(2))
            // Remove any items that are contained in stopwords array
            .filter(item => !stopwords.includes(item.toLowerCase()))
            // Trim whitespace
            .map(item => item.trim())
        ),
        insight => ({ text: insight })
      );

  for (let insight of insights) {
    // Get definition from English Wiktionary
    insight.definition =
      (await wtf.fetch(
        insight.text,
        undefined,
        (() => {
          let runs = 0;
          const opt = {
            get wikiUrl() {
              // @ts-ignore oh yes I can, TypeScript
              if (++runs == 2) delete opt.wikiUrl;
              return 'https://en.wiktionary.org/w/api.php';
            }
          };
          return opt;
        })()
      )) || undefined;

    // Get definition from English Wikipedia
    insight.wiki = (await wtf.fetch(insight.text)) || undefined;
  }

  return insights;
}
