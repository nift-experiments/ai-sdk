import React from 'react';
import {CommandPromptContent,CommandPromptCopy,CommandPromptList,CommandPromptPrefix,CommandPromptRoot,CommandPromptSurface,CommandPromptTrigger,CommandPromptTriggerDivider,CommandPromptViewport} from '@vercel/geistdocs/components/command-prompt';
export function HomeInstall(){return (<CommandPromptRoot
            className="mt-8 flex w-full flex-col items-center gap-2"
            defaultValue="humans"
          >
            <CommandPromptList>
              <CommandPromptTrigger value="humans">
                For humans
              </CommandPromptTrigger>
              <CommandPromptTriggerDivider />
              <CommandPromptTrigger value="agents">
                For agents
              </CommandPromptTrigger>
            </CommandPromptList>
            <CommandPromptSurface>
              <CommandPromptPrefix>$</CommandPromptPrefix>
              <CommandPromptViewport>
                <CommandPromptContent value="humans">
                  npm install ai
                </CommandPromptContent>
                <CommandPromptContent value="agents">
                  npx skills add vercel/ai
                </CommandPromptContent>
              </CommandPromptViewport>
              <CommandPromptCopy aria-label="Copy install command" />
            </CommandPromptSurface>
          </CommandPromptRoot>);}
