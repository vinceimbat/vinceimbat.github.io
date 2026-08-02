---
aliases: null
created: 2024-12-02 15:46:43+08:00
dg-home: null
dg-publish: true
draft: false
modified: 2025-03-26 16:56:41+08:00
publish: true
tags:
- species/literature
- status/seedling
title: Highlight-driven practice and comprehension support by Andy Matuschak
---

## Highlights

when people struggle to recall and use what they’ve read after a few months, it’s often because they didn’t really understand in the first place.

“[books don’t work](https://andymatuschak.org/books)” because people seem to rapidly forget almost all of what they read.

I’ve been exploring how reading environments might directly support comprehension, learning what we know about [expert practice](https://www.patreon.com/posts/reading-and-85345515?cid=112853575) and [interventions](https://www.patreon.com/posts/initial-in-self-87053505).

These are the (hypothesized) problems that set me on this path in the first place:

1. Retrieval practice of poorly-comprehended conceptual material usually doesn’t actually work; you can parrot but can’t use the knowledge.
2. When retrieval practice feels dogmatic—like “guessing the teacher’s password”—that’s often _because_ of comprehension gaps. This is especially true when someone else writes the prompts.
3. Retrieval practice (and problem-solving practice) are unpleasant and indirect ways to diagnose and fix comprehension gaps.

one way to deal with these problems is to ensure that people only practice material which they comprehend.

### Concept overview

Here’s the high-level design:

1. As you read a text, you have a magic highlighter. You can use it to mark anything important, anything you want to make sure you understand and remember. Maybe you can jot a few extra words to clarify what specifically interests you.
2. Future practice sessions will include tasks which reinforce and elaborate the ideas you highlighted.
3. When you finish reading a section, you can press a button to highlight other important details which you _didn’t_ mark (in a different color, say). These “extra” (“suggested”? “shadow”?) highlights let you quickly check whether you skimmed over something you might value.

**The main design insight is that a highlight interaction can serve both as a way for the reader to choose what to practice and _also_ as a (weak) indication of comprehension.**

That same highlight primitive can then be repurposed to draw attention—in a very lightweight way—to important details which the reader might have unknowingly missed.

### Conceptual elements I like about this design

In my proposed design, the act of highlighting would be as ineffective as it usually is; what’s different is that those highlights would trigger later practice (which we know can be quite effective) and comprehension feedback (efficacy to be determined).

give readers control over what they practice. But it extends that goal to the comprehension support interaction.

in the proposed design, when you use the magic highlighter, you’re teeing up future practice which will ensure that you understand and remember that detail. The interaction isn’t thrown away; it has enduring meaning and weight.

what people really wanted was to be able to _point at the idea they found important_; the prompts are mostly just implementation details.

readers often weren’t initially sure how much they cared about a detail. They could see that it was important. But did they want to sign up for ongoing practice? It wasn’t clear—they had to read a little further, to get a sense of how that detail fit into the whole. Many readers asked for a highlighter

People wanted to mark details as _tentatively_ important, then to come back and “upgrade” those details by saving the adjacent prompts later

I’ll read through a section, highlighting what seems important. Then I’ll make a second pass, guided by my highlights, to write prompts for whichever details seem to deserve it.

You can have an ordinary yellow highlighter to mark details which seem tentatively important, and a purple “magic” highlighter to mark details you want to make sure get reinforced. Highlights can be “swapped” to the other color with a click. Readers would have a smooth slope between “mark as important” to “mark as to-be-reinforced.”

### Conceptual challenges for this design

**Highlights don’t encourage deep processing.**

You’ll be much less likely to be given prompts about ideas you completely missed. And the prompts can be constructed to _induce_ the elaboration and interpretation which might not yet have occurred.

**Density and ambiguity.**

I’ve found that helps to make “minimal” highlights—i.e. to highlight a key adjective if that’s what you’re interested in, alongside perhaps other separate small highlights in the same sentence. It also helps in these cases to jot a few words about your specific interest.

**Trees over forest.**

A highlight-centric interaction emphasizes locality and detail. But I usually want practice to include synthesis, too.

Sometimes I want my practice to be about summarizing a long exposition.

**Novices can’t reliably judge what matters.**

### An initial test

“extra highlights” interaction can surface comprehension gaps.

the interaction _felt great._ I already like to highlight as I read; this felt like it was working with my natural behavior and making it more powerful, rather than distorting my reading practices.

It feels subtly rewarding to “[color in](https://www.patreon.com/posts/initial-in-self-87053505#:~:text=And%20there%E2%80%99s%20a%20funny%20thing%20that%20happens%3A%20the%20shading%20is%20somehow%20viscerally%20rewarding!%20It%20feels%20good%20to%20%E2%80%9Cfill%20up%E2%80%9D%20the%20sidebar%2C%20to%20%E2%80%9Ccolor%20in%E2%80%9D%20all%20the%20%E2%80%9Cgood%20bits%E2%80%9D.)” the text, and even better to make those markings have real meaning, both in terms of the comprehension check and in terms of subsequent practice.

Perhaps highlights could display some mark of their importance, e.g. with color intensity? If a reader could mark something as lower priority, we could then arrange to show them relatively fewer tasks about that detail. Alternately, these levels could act as a kind of feedback for readers that they’re mostly highlighting relatively unimportant details, and not the central ideas.

My rough impression is that conceptual gaps are more likely to be ignored or poorly diagnosed by problem-solving practice than factual or procedural gaps.

### Evaluating with Quantum Country

One fix might be to assign these “synthesis / inference” prompts if a user’s highlights include the “inputs” to the expected inference. These sorts of prompts seem especially valuable to me, since they force the reader to go beyond the text. At the same time, because the whole point of these prompts is that you’re _not_ retrieving the answer from memory, you’d probably want them to vary each time, demanding a new inference involving those ideas.

### Interaction cost

if QCVC contains 112 prompts, a reader wouldn’t want to make 112 decisions about which prompts to save, or even to click “save this prompt” 112 times in the interface!

**highlighting is a natural behavior for many readers. It feels like _part of reading the text_, not a separate decision or interaction. Spatially, it’s happening _within_ the text, not on a separate interface surface.**

in the proposed design, you’re not deciding “which prompts to save”; you’re emphasizing a subset of the text you’ve already read. The “extra highlights” view will offer a lightweight way to quickly add anything important that you might have missed, and even this interaction will be less demanding than evaluating prompts, since you’re evaluating the main text, much or all of which you’ve already read.

But in the proposed design, a user might naturalistically not highlight some text representing a less important detail, and that’s no big deal. The text doesn’t impose a cost. And the cost of evaluating an “extra highlight”, while low, could be further mitigated by a visual indication of importance.

### Implementation details and challenges

We can factor this design’s implementation into three core problems:

1. **Text to curated highlights:** Given a text, what are the most important details to understand, and what highlights would draw one’s attention most appropriately to those details?
2. **Highlights to tasks:** Given a set of highlights-in-context (and, potentially, emphasis remarks), construct a set of practice tasks.
3. **Semantic highlight diff:** Given a set of user highlights-in-context, determine which of the curated highlights’ conceptual matter is not “covered”?

The freeform nature of the highlight interaction cries out for the open-ended interpretation that is these models’ hallmark. And an idea-centric practice system requires high-quality task generation machinery. By shifting (or expanding) the system’s primitive from prompts to ideas-in-context, we would make it much easier for users to add their own ideas to their practice.

**The highlighting interaction can apply to your own notes. If you read a text and notice some important limitation in the author’s argument, you can jot a sentence about that and highlight your own words.**

**if you’re writing in your journal about a striking comment from a friend, you could simply highlight that remark to ensure you’d grapple with it in future sessions.**

Highlights to tasks: The most difficult of the tasks.

you can’t describe the sorts of tasks you want (and don’t want) clearly enough. Still, for basic retrieval practice tasks, I can get usable results somewhat more than half the time.

### Next steps

- How the tasks mapped from their highlights feel, emotionally—is there still a sense of guess-the-password if they indirectly “signed up for” these tasks?

three distinct problems which have emerged in my experiments over the past few years:

1. The mnemonic medium [feels unpleasantly authoritarian in many contexts](https://www.patreon.com/posts/revamping-medium-55309960); the locus of control should move towards readers.
2. Comprehension gaps are routine; [practicing others’ prompts doesn’t work and feels oppressive when this occurs](https://www.patreon.com/posts/reading-and-85345515?cid=112853575) in conceptual material.
3. “Mere” retrieval practice of conceptual material often produces brittle understanding which transfers poorly; [more fluid practice would likely produce more fluid understanding](https://www.patreon.com/posts/fluid-practice-83882597).

## References

Matuschak, Andy. “Highlight-Driven Practice and Comprehension Support.” _Patreon_, 1 Oct. 2023, [https://www.patreon.com/posts/highlight-driven-90101210](https://www.patreon.com/posts/highlight-driven-90101210).