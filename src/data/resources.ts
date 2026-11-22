// Outside resources listed on the Resources page.
// To add or change an entry, edit this file only. Keep descriptions short, in plain
// language, and say only what we have checked. Update LAST_CHECKED when links are reviewed.

export const RESOURCES_LAST_CHECKED = "2026-11-22";

export type Resource = {
  name: string;
  url: string;
  description: string;
};

export type ResourceGroup = {
  id: string;
  title: string;
  intro?: string;
  items: Resource[];
};

export const RESOURCE_GROUPS: ResourceGroup[] = [
  {
    id: "describe-images",
    title: "Gemini Gems for describing images",
    intro:
      "Gemini Gems from the UAH STEM Access community, made by Dawn Dunaway. A Gem is a saved set of instructions that you use in a Google Gemini chat.",
    items: [
      {
        name: "Chart, Graph & Complex Image Alt Text Assistant",
        url: "https://gemini.google.com/gem/1UM-Ie-pwXC41qL12c-UKVV9F9sKNU2KW?usp=sharing",
        description:
          "Turns charts, graphs and diagrams into short alt text and a structured long description.",
      },
      {
        name: "Engineering Alt Text Assistant",
        url: "https://gemini.google.com/gem/1l_khSLOfHKQgTJDmZVZIzqK071LWJoJm?usp=sharing",
        description:
          "Drafts alt text and technical descriptions for engineering schematics, scientific figures, micrographs, CAD and reaction schemes.",
      },
      {
        name: "STEM Exam Situation Description Generator",
        url: "https://gemini.google.com/gem/11XGMi_iSzN-ZGw-cndHfcvTun949yqzo?usp=sharing",
        description:
          "Helps describe exam diagrams, math problems, graphs, tables and multiple-choice materials without giving away hints.",
      },
    ],
  },
  {
    id: "describe-images-web-tool",
    title: "A web tool for describing images and extracting text",
    items: [
      {
        name: "Image Accessibility Creator",
        url: "https://asuo-ai-labs.streamlit.app/Image_Accessibility",
        description:
          "Upload an image to get alt text and a detailed description, or to extract text from slides and images that are not accessible. You can add details and generate the description again. It uses OpenAI’s GPT-4o, and the data sent is not retained or used to train models.",
      },
    ],
  },
  {
    id: "images-to-text",
    title: "Turn images of tables and math into text",
    items: [
      {
        name: "Creating Accessible Tables from Images with Microsoft Copilot (UT San Antonio)",
        url: "https://utsa.screenstepslive.com/a/2100652-creating-accessible-tables-from-images-with-microsoft-copilot-ai-a-step-by-step-guide",
        description:
          "A three-step guide: transcribe the table, convert it to a Markdown table, then build an accessible Word table. It stresses checking the result against the original image.",
      },
      {
        name: "AMIE Leaderboard (DAISY Consortium)",
        url: "https://dl.daisy.org/tools/Fido/web/AMIE/leaderboard.html",
        description:
          "Compares how accurately AI tools and converters recognise and convert math, scored by what a screen reader would say using MathCAT. The ranking changes over time.",
      },
    ],
  },
  {
    id: "accessible-math",
    title: "Write accessible math",
    items: [
      {
        name: "Guidance for Enhancing Digital Accessibility of Mathematics (American Mathematical Society)",
        url: "https://www.ams.org/accessibility/accessibility-guidance",
        description:
          "Advice and tools for authors of math documents, including converting LaTeX to accessible HTML.",
      },
      {
        name: "The PreTeXt Guide",
        url: "https://pretextbook.org/doc/guide/html",
        description:
          "PreTeXt is a free, open-source system for writing scholarly documents in XML, with LaTeX syntax for math. One source produces accessible HTML, PDF, EPUB, braille and more.",
      },
    ],
  },
  {
    id: "chemistry",
    title: "Accessible chemistry",
    items: [
      {
        name: "Chemistry for Web Publishing Community Group (W3C)",
        url: "https://www.w3.org/groups/cg/chem-web-pub/",
        description:
          "A W3C group working on moving chemistry content from images to a form that works for everybody. Anyone with a W3C account can join.",
      },
    ],
  },
];
