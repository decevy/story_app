using StoryApp.Core.Entities;
using Microsoft.EntityFrameworkCore;

namespace StoryApp.Infrastructure.Data;

public static class StoryDbSeeder
{
    private readonly record struct SeedSegment(string Text, Seam? SeamAfter = null);

    public static async Task SeedAsync(StoryDbContext context, CancellationToken cancellationToken = default)
    {
        if (await context.Users.AnyAsync(cancellationToken))
            return;

        var users = new List<User>
        {
            new User
            {
                Username = "aya",
                Email = "aya@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123"),
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                LastSeen = DateTime.UtcNow
            },
            new User
            {
                Username = "bobby",
                Email = "bobby@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123"),
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                LastSeen = DateTime.UtcNow
            },
            new User
            {
                Username = "carlos",
                Email = "carlos@test.com",
                PasswordHash = BCrypt.Net.BCrypt.HashPassword("test123"),
                IsOnline = false,
                CreatedAt = DateTime.UtcNow,
                LastSeen = DateTime.UtcNow
            }
        };

        await context.Users.AddRangeAsync(users, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        context.ChangeTracker.Clear();

        var stories = new List<Story>
        {
            new Story
            {
                Name = "De herberg aan de kruising",
                Description = "Twee reizigers stoppen waar de wegen samenkomen.",
                IsPrivate = false,
                CreatedBy = users[0].Id,
                CreatedAt = DateTime.UtcNow
            },
            new Story
            {
                Name = "Het licht op het eiland",
                Description = "Een wachter houdt het licht brandend terwijl de zee zwijgt.",
                IsPrivate = false,
                CreatedBy = users[1].Id,
                CreatedAt = DateTime.UtcNow
            },
            new Story
            {
                Name = "De brief en de sleutel",
                Description = "Twee nichten vinden op zolder een brief die op hen wachtte.",
                IsPrivate = true,
                CreatedBy = users[0].Id,
                CreatedAt = DateTime.UtcNow
            }
        };

        await context.Stories.AddRangeAsync(stories, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        context.ChangeTracker.Clear();

        var aya = users[0].Id;
        var bobby = users[1].Id;
        var carlos = users[2].Id;

        // Story 0: aya + bobby; Story 1: bobby + carlos; Story 2: aya + carlos.
        var writers = new List<Writer>
        {
            new Writer { UserId = aya, StoryId = stories[0].Id, JoinedAt = DateTime.UtcNow },
            new Writer { UserId = bobby, StoryId = stories[0].Id, JoinedAt = DateTime.UtcNow },

            new Writer { UserId = bobby, StoryId = stories[1].Id, JoinedAt = DateTime.UtcNow },
            new Writer { UserId = carlos, StoryId = stories[1].Id, JoinedAt = DateTime.UtcNow },

            new Writer { UserId = aya, StoryId = stories[2].Id, JoinedAt = DateTime.UtcNow },
            new Writer { UserId = carlos, StoryId = stories[2].Id, JoinedAt = DateTime.UtcNow }
        };

        await context.Writers.AddRangeAsync(writers, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
        context.ChangeTracker.Clear();

        static List<PassageSegment> MapSegments(IReadOnlyList<SeedSegment> segments)
        {
            var mapped = new List<PassageSegment>(segments.Count);
            for (var i = 0; i < segments.Count; i++)
            {
                var seed = segments[i];
                mapped.Add(new PassageSegment
                {
                    Order = i,
                    Text = seed.Text,
                    SeamAfter = seed.SeamAfter
                });
            }

            return mapped;
        }

        static List<Passage> BuildRoundRobinStory(
            int storyId,
            int firstUserId,
            int secondUserId,
            SeedSegment[][] passagesInOrder,
            int startMinuteOffsetInclusive,
            int endMinuteOffsetInclusive)
        {
            var passages = new List<Passage>(passagesInOrder.Length);
            var stepCount = passagesInOrder.Length - 1;
            if (stepCount < 0)
                return passages;

            for (var i = 0; i < passagesInOrder.Length; i++)
            {
                var t = stepCount == 0
                    ? endMinuteOffsetInclusive
                    : startMinuteOffsetInclusive
                      + (endMinuteOffsetInclusive - startMinuteOffsetInclusive) * i / stepCount;

                passages.Add(new Passage
                {
                    Order = i,
                    UserId = i % 2 == 0 ? firstUserId : secondUserId,
                    StoryId = storyId,
                    CreatedAt = DateTime.UtcNow.AddMinutes(t),
                    Segments = MapSegments(passagesInOrder[i])
                });
            }

            return passages;
        }

        SeedSegment[][] innPassages =
        [
            [
                new("We waren laat. ", Seam.Inline),
                new("De herberg stond waar twee wegen elkaar kruisten, en de deur stond open. ", Seam.Paragraph)
            ],
            [
                new("Binnen rook het naar brood. ", Seam.Inline),
                new("Een man veegde de vloer alsof hij de dag wilde sluiten zonder hem te vergeten. ", Seam.Paragraph)
            ],
            [
                new("Hij keek op. ", Seam.Inline),
                new("Wie honger heeft, mag blijven, zei hij. ", Seam.Paragraph)
            ],
            [
                new("We gingen zitten. ", Seam.Inline),
                new("Niemand vroeg waar we vandaan kwamen. ", Seam.Section)
            ],
            [
                new("De soep was eenvoudig. ", Seam.Inline),
                new("Juist daarom smaakte ze naar iets wat ik lang had gemist. ", Seam.Paragraph)
            ],
            [
                new("Mijn vriend zei dat een reis begint op het moment dat je stopt met haasten. ", Seam.Paragraph)
            ],
            [
                new("Ik wilde zeggen dat we een schema hadden. ", Seam.Inline),
                new("De woorden bleven in mijn mond. ", Seam.Section)
            ],
            [
                new("Buiten ging de wind liggen. ", Seam.Paragraph)
            ],
            [
                new("De waard zette een kaars op tafel. ", Seam.Inline),
                new("Hij zei dat licht niet van de kaars is, maar van degene die ernaar kijkt. ", Seam.Paragraph)
            ],
            [
                new("We aten in stilte. ", Seam.Inline),
                new("Stilte is ook een vorm van gezelschap. ", Seam.Paragraph)
            ],
            [
                new("Bij de deur zei hij: de weg kiest niet. ", Seam.Inline),
                new("Jij kiest of je hem volgt. ", Seam.Paragraph)
            ],
            [
                new("We betaalden met wat we hadden. ", Seam.Inline),
                new("Het was genoeg. ", Seam.Paragraph)
            ],
            [
                new("We liepen verder. ", Seam.Inline),
                new("Achter ons bleef de lamp branden, klein en zeker. ")
            ]
        ];

        SeedSegment[][] lighthousePassages =
        [
            [
                new("Ik schrijf dit bij het vallen van de avond. ", Seam.Paragraph)
            ],
            [
                new("De zee was rustig, en toch hoorde ik haar. ", Seam.Inline),
                new("Ze sprak niet in woorden. ", Seam.Paragraph)
            ],
            [
                new("Een oude man had me gezegd: bewaak het licht, niet de storm. ", Seam.Section)
            ],
            [
                new("Ik poetste het glas tot ik mijn eigen gezicht zag. ", Seam.Paragraph)
            ],
            [
                new("In de nacht kwam de mist. ", Seam.Inline),
                new("Ik liet de lamp draaien, zoals ik had beloofd. ", Seam.Paragraph)
            ],
            [
                new("Een schip antwoordde met één flits. ", Seam.Inline),
                new("Dat was genoeg om niet alleen te zijn. ", Seam.Section)
            ],
            [
                new("Bij dageraad lag zout op de reling. ", Seam.Paragraph)
            ],
            [
                new("Ik dacht aan de mensen op het land. ", Seam.Inline),
                new("Zij slapen terwijl iemand wakker blijft. ", Seam.Paragraph)
            ],
            [
                new("De meeuwen kwamen terug. ", Seam.Inline),
                new("Zij kennen de weg zonder kaart. ", Seam.Paragraph)
            ],
            [
                new("Ik sloot het logboek. ", Seam.Inline),
                new("Wat telt, staat niet altijd op papier. ")
            ]
        ];

        SeedSegment[][] letterPassages =
        [
            [
                new("Op zolder vonden we een envelop. ", Seam.Inline),
                new("Hij lag daar alsof hij op ons had gewacht. ", Seam.Paragraph)
            ],
            [
                new("Erin zat een brief, en een koperen sleutel. ", Seam.Paragraph)
            ],
            [
                new("Mijn nicht las de eerste regel hardop. ", Seam.Inline),
                new("Wie zoekt wat hij al heeft, vindt de deur niet. ", Seam.Section)
            ],
            [
                new("We zwegen. ", Seam.Inline),
                new("Soms is stilte het enige eerlijke antwoord. ", Seam.Paragraph)
            ],
            [
                new("De sleutel was klein. ", Seam.Inline),
                new("Hij woog meer dan hij leek. ", Seam.Paragraph)
            ],
            [
                new("In de kantlijn stond: het hart is een slot dat opent als je ophoudt te forceren. ", Seam.Section)
            ],
            [
                new("We daalden de trap af. ", Seam.Inline),
                new("Beneden rook het huis naar hout en naar thee. ", Seam.Paragraph)
            ],
            [
                new("Ze zei dat we de brief niet hoefden te begrijpen om hem te bewaren. ", Seam.Paragraph)
            ],
            [
                new("Ik legde de sleutel in mijn zak. ", Seam.Inline),
                new("Niet om een deur te openen, maar om te onthouden dat er één was. ")
            ]
        ];

        var passages = new List<Passage>();
        passages.AddRange(BuildRoundRobinStory(stories[0].Id, aya, bobby, innPassages, -132, -90));
        passages.AddRange(BuildRoundRobinStory(stories[1].Id, bobby, carlos, lighthousePassages, -88, -46));
        passages.AddRange(BuildRoundRobinStory(stories[2].Id, aya, carlos, letterPassages, -44, -2));

        await context.Passages.AddRangeAsync(passages, cancellationToken);
        await context.SaveChangesAsync(cancellationToken);
    }
}
