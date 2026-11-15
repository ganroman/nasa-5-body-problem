# How stories grow

The library is a set of stories about fire and weightlessness. This page says how a story is made and what it rests on.

## The steps

1. **A direction.** One question about fire and weightlessness, kept on the shelf in `data/stories.json`. Until evidence exists the status stays `hypothesis`.
2. **Collect evidence.** A person or an agent finds sources and records verbatim quotes with links.
3. **Pass the three gates.** The citation gate, the live quote check and the LLM judge, described in [evidence-method.md](evidence-method.md).
4. **Publish with its status.** The story goes live marked `data`, `partial` or `hypothesis`, with the gaps it still has.
5. **Questions become new directions.** What a published story leaves open goes back to step 1.

A story's evidence status comes from evidence alone.

## Limits

- The site has no likes, comments or voting. A story with `state` other than `published` in `data/stories.json` is hidden everywhere on the site until it is written.
- Text from a source is quoted, never paraphrased into a stronger claim.
