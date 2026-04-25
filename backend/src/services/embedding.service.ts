/**
 * Embedding Service — Local vector generation using Xenova/transformers
 *
 * Model: all-MiniLM-L6-v2 (384 dimensions)
 * Runs entirely locally — no API costs, no external calls.
 * Generates semantic embeddings for skills to power pgvector similarity search.
 */

let pipeline: any = null;

/**
 * Lazy-load the embedding pipeline (downloads model on first use, ~80MB, cached after).
 */
async function getEmbedder() {
    if (!pipeline) {
        const { pipeline: createPipeline } = await import('@xenova/transformers');
        pipeline = await createPipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
        console.log('✅ Embedding model loaded: all-MiniLM-L6-v2 (384-dim)');
    }
    return pipeline;
}

const embeddingCache = new Map<string, number[]>();

/**
 * Generate a 384-dim embedding for a skill description.
 * Enriches the skill_name with proficiency context for better semantic matching.
 *
 * Examples:
 *   "Python (expert)" → embeds as "Python programming language, expert level proficiency"
 *   "React (beginner)" → embeds as "React frontend framework, beginner level proficiency"
 */
export async function generateSkillEmbedding(
    skillName: string,
    proficiency: string = 'intermediate'
): Promise<number[]> {
    // Enrich with context so "Python" understands it's programming, not the snake
    const text = `${skillName}, ${proficiency} level proficiency`;

    if (embeddingCache.has(text)) {
        return embeddingCache.get(text)!;
    }

    const embedder = await getEmbedder();
    const output = await embedder(text, { pooling: 'mean', normalize: true });
    const embedding = Array.from(output.data as Float32Array);
    
    // Keep a reasonable cache limit
    if (embeddingCache.size < 10000) {
        embeddingCache.set(text, embedding);
    }
    
    return embedding;
}

/**
 * Generate embeddings for a batch of skills independently in parallel.
 */
export async function generateSkillEmbeddings(
    skills: { name: string; proficiency: string }[]
): Promise<{ name: string; embedding: number[] }[]> {
    return Promise.all(skills.map(async skill => {
        const embedding = await generateSkillEmbedding(skill.name, skill.proficiency);
        return { name: skill.name, embedding };
    }));
}

/**
 * Generate a query embedding for matching.
 * Takes the required skills and brief, creates a single composite embedding.
 */
export async function generateQueryEmbedding(
    skills: { name: string; priority: string }[],
    brief?: string
): Promise<number[]> {
    const embedder = await getEmbedder();

    // Build a rich query string that captures intent
    const skillParts = skills.map(s =>
        `${s.name} (${(s.priority || 'required').toLowerCase()} skill)`
    ).join(', ');

    const text = brief
        ? `${brief}. Required skills: ${skillParts}`
        : `Looking for professionals skilled in: ${skillParts}`;

    const output = await embedder(text, { pooling: 'mean', normalize: true });
    return Array.from(output.data as Float32Array);
}
