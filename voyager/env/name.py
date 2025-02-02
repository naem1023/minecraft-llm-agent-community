import random


sample_names = [
    "Alice",
    "Bob",
    "Charlie",
    "David",
    "Eve",
    "Frank",
    "Grace",
    "Hank",
    "Ivy",
    "Jack",
]


def get_random_name() -> str:
    return random.choice(sample_names)
