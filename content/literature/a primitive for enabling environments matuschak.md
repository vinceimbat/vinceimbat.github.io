---
aliases: null
created: 2024-12-02 09:53:54+08:00
dg-home: null
dg-publish: true
draft: false
modified: 2025-03-26 16:58:23+08:00
publish: true
tags:
- species/literature
- status/seedling
title: A primitive for enabling environments; early work on machine-generated prompts
  by Andy Matuschak
---

## Highlights

### The need for a new central primitive

the further you get from that simple fact--flashcard correspondence, the less well these systems work, and the more difficult they are to use.

"memory system" is a more powerful framing for this problem space than "spaced repetition system". The latter phrase emphasizes one tactic.

You want a system which causes you to robustly remember.

For robust memory of vocabulary, mere spaced repetition may be enough.

But for more complex ideas, I find that flashcards alone often produce a brittle memory.

An effective memory system would help me build robust memory by presenting the idea with different cues, from different angles, through different connections, so that I encode the memory in many ways.

I don't just want to remember; I want to _learn_. I want those topics I'm practicing to be alive and functional. I want to be able to apply the material flexibly and fluently. I want my understanding to deepen over time. I want to see new implications and have new ideas.

you should learn before you memorize.

this is an ongoing parallel process. As we exercise and elaborate material we've learned, we make new connections and understand more deeply.

Memorization is intertwined with that process, not something that happens before or after.

even the term "memory system" is inadequate. Our aspirational system needs a broader name

"enabling environment"

All this is awfully cognitive. Much of what I put in my spaced repetition system isn't.

The point here isn't really to memorize. It's to be changed--to metabolize an experience so that I feel or act differently in the future. But that point is also true of much of my more traditional learning.

A system focused on this would be an "enabling environment" in a much deeper sense.

### An alternative primitive: situated ideas

my central complaint about flashcards: they're static.

Robust memory requires varied cues and connectivity; robust learning requires rising depth and complexity; robust metabolization requires contextuality and vividness.

To bring dynamism to these systems, I think we need new central primitives.

If we want our review sessions to vary and deepen and connect over time, we can't just supply a static task.

if the goal is to support transfer learning, we can't write the task ourselves at all: transfer requires surprise.

We need to somehow point to the idea which inspired that task, situated within the context which inspired us, so that a stream of varying and deepening tasks can emanate from it over time.

More concretely, instead of question/answer fields, the primitive I have in mind--a _"situated idea"_?--would store:
- a pointer to relevant context, with full text; e.g. a book, a journal, etc.
- a range (or ranges?) within that context representing the idea to be metabolized; i.e. like a highlight you made in your book
- an optional extra comment clarifying your intent or interest; i.e. like marginalia you wrote next to your highlight

And then the system would synthesize appropriate activities over time, based on that input, and on connections with other situated ideas in related contexts.

All this roughly mimics the work that professional instructional designers do: given a set of "knowledge points" introduced in a text, they construct a series of activities (worked examples, exercises, reflections) and present them in varying and deepening ways over time.

self-motivated adult readers rarely want to passively study whatever an author tells them. People want different things from a text. They have different goals.

When students are polled about their favorite study practices, the most common responses are usually re-reading and highlighting. Meanwhile, if you make a list of the most effective study practices, those two methods are usually at the bottom. But highlighting feels great: it's a way of indicating interest, a way of participating, of literally making your mark on the text.

you could use a special highlighter to add "situated ideas" to your library, and then the system would ensure that you'd internalize that material.

### Alright, okay, fine: machine-generated retrieval practice tasks

I want something like a spaced repetition system, but where review activities vary and deepen and connect over time. Such a system would necessarily require extremely expensive content-by-content labor, or machine-generated tasks. And only machine-generated tasks afford the possibility of activities tailored to idiosyncratic personal contexts.

We've created a nice workflow:

- as we read a PDF or web article, we highlight it with Hypothes.is
- a bot replies to the highlights with proposed tasks
- we reply to each of those replies with a machine-readable "grade"; freeform critical comments; (optionally) a "corrected" rewrite of the same task; and (optionally) tags for failure modes we've noticed (e.g. focusing on trivial details)
- when none of the machine-generated tasks is good, we reply to the highlight ourselves with the tasks we would have wanted

### What's next

Our plan is to work towards an interface which would allow users to conveniently highlight texts and import the resulting tasks into Anki, Mnemosyne, and other tools.

In an ideal integration, the user wouldn't evaluate the machine-generated tasks while they're reading. They would just read, and highlight, and then later review. The trouble here is that sometimes a given highlight could reasonably point to several distinct ideas--and you probably don't want all of them. Users will need to give the system feedback on targeting, on their desired level of depth, and so on.

### Comments

Recall of static prompts is faster but I think it's suboptimal and more likely to get boring over time, and of course the initial compression process during prompt writing is potentially lossy and very effortful.

To me the effort of writing prompts is still far and away the biggest barrier to consistent spaced repetition usage

My current workflow is to highlight as I read, then (at article or chapter end) write a very clear bullet point summary based on the highlights, then write prompts, generally with help from LLMs.

The intermediate summary is to handle ideas that are spread out across multiple highlights, clarify my own understanding, and help guide the LLMs. I find that if I don't do it then, I realistically never do it.

I find that this process takes about 3-5x as long as just reading the text in question, and maybe 20-40% of that time is spent really fully internalizing the ideas

while LLMs can help formulate prompts and answers given specific goals, highlights by themselves are very much not enough for all but very specific points. Combining a highlight (or a few) with a quick list of questions of interested (even if phrased poorly) gave me MUCH better results.

**taking very light annotations as I read and then using the LLM to create prompts at chapter end works and feels MUCH better than trying to go from highlights to summary to prompts.**

using the key prompts I identified to ask the LLM to write a tailored summary of the parts that matter most to me actually works much better.

## References

Matuschak, Andy. “A Primitive for Enabling Environments; Early Work on Machine-Generated Prompts | Andy Matuschak.” _Patreon_, 29 Nov. 2024, [https://www.patreon.com/posts/116921064](https://www.patreon.com/posts/116921064).