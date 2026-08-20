using NUnit.Framework;

// Enable parallel execution at assembly level
[assembly: Parallelizable(ParallelScope.Fixtures)]

// Set the level of parallelism
[assembly: LevelOfParallelism(4)]