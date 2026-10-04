namespace StoryApp.Core.Entities;

/// <summary>
/// How narrative flow continues after a beat segment or at a beat boundary (<see cref="Beat.TransitionOverride"/>).
/// </summary>
public enum BeatTransition
{
    SameParagraph,
    NewParagraph,
    NewSection,
    NewSectionMajor,
    NewChapter
}
