import { quizzesQueryOptions, type QuizMeta } from "#/features/quiz-core";
import { useQuery } from "@tanstack/react-query";
import { createContext, useContext } from "react";
import { QuizCard } from "..";

const QuizListContext = createContext<{ quizzes: QuizMeta[] } | null>(null);

type QuizListRootProps = {
    children: React.ReactNode;
    loadingComponent?: React.ReactNode;
    errorComponent?: React.ReactNode;
    emptyComponent?: React.ReactNode;
}

function QuizListRoot({ children, loadingComponent, errorComponent, emptyComponent }: QuizListRootProps) {
    const { isLoading, isError, data: quizzes } = useQuery(quizzesQueryOptions())

    if (isLoading) return loadingComponent
    if (isError) return errorComponent
    if (!quizzes) return emptyComponent
    if (quizzes.length === 0) return emptyComponent

    return (
        <QuizListContext.Provider value={{ quizzes }}>
            {children}
        </QuizListContext.Provider>
    );
}
QuizList.Root = QuizListRoot;

function QuizList({ loadingComponent, errorComponent, emptyComponent }: Omit<QuizListRootProps, 'children'>) {
    return (
        <QuizListRoot loadingComponent={loadingComponent} errorComponent={errorComponent} emptyComponent={emptyComponent}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <QuizListRepeatable>
                    {(quiz) => (
                        <QuizCard key={quiz.id} quiz={quiz} />
                    )}
                </QuizListRepeatable>
            </div>
        </QuizListRoot>
    )
}
QuizList.List = QuizList;


function QuizListRepeatable({ children }: { children: (quiz: QuizMeta, index: number) => React.ReactNode }) {
    const { quizzes } = useQuizContext()
    return quizzes.map((quiz, index) => (
        children(quiz, index)
    ))
}
QuizList.Repeatable = QuizListRepeatable;

function useQuizContext() {
    const context = useContext(QuizListContext);
    if (!context) throw new Error('useQuizContext must be used within a QuizList');
    return context;
}


export { QuizList };