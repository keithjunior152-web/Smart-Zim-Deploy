import { useListSyllabusTopics } from "@workspace/api-client-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckCircle2, ListTree } from "lucide-react";
import { useMyCurriculum, allSubjects } from "@/lib/useCurriculum";

export default function Syllabus() {
  const { curriculum } = useMyCurriculum();
  const curriculumSubjects = allSubjects(curriculum);
  const levels = curriculum?.levels ?? [];
  const [subject, setSubject] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const effSubject = subject || curriculumSubjects[0] || "Mathematics";
  const effLevel = level || levels[0]?.value || "O-Level";

  const { data: topics, isLoading } = useListSyllabusTopics({
    subject: effSubject,
    level: effLevel,
    curriculum: curriculum?.code || undefined,
  });

  const strands = Array.from(new Set(topics?.map(t => t.strand) || []));

  return (
    <div className="space-y-8 pb-20 md:pb-0 max-w-4xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-foreground">Syllabus Tracker</h1>
        <p className="text-muted-foreground mt-1">Navigate your curriculum step by step</p>
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-xl border">
        <Select value={effSubject} onValueChange={setSubject}>
          <SelectTrigger className="w-full sm:w-[200px] bg-background">
            <SelectValue placeholder="Select Subject" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            {curriculumSubjects.map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={effLevel} onValueChange={setLevel}>
          <SelectTrigger className="w-full sm:w-[200px] bg-background">
            <SelectValue placeholder="Select Level" />
          </SelectTrigger>
          <SelectContent>
            {levels.map((l) => (
              <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : topics && topics.length > 0 ? (
        <div className="space-y-6">
          {strands.map(strand => {
            const strandTopics = topics.filter(t => t.strand === strand);
            return (
              <div key={strand} className="border rounded-xl bg-card overflow-hidden">
                <div className="bg-primary/5 px-6 py-4 border-b">
                  <h2 className="font-bold text-lg text-primary">{strand}</h2>
                  <p className="text-sm text-muted-foreground">{strandTopics.length} topics</p>
                </div>
                <Accordion type="multiple" className="w-full">
                  {strandTopics.map(topic => (
                    <AccordionItem key={topic.id} value={`item-${topic.id}`} className="px-6 border-b-0 border-t first:border-t-0">
                      <AccordionTrigger className="hover:no-underline py-4">
                        <span className="font-semibold text-left">{topic.topic}</span>
                      </AccordionTrigger>
                      <AccordionContent className="pb-4">
                        {topic.learningObjectives && (
                          <div className="mb-4 p-3 bg-muted rounded-lg text-sm">
                            <span className="font-semibold block mb-1">Objectives:</span>
                            {topic.learningObjectives}
                          </div>
                        )}
                        <ul className="space-y-2">
                          {topic.subtopics.map((sub, idx) => (
                            <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                              <CheckCircle2 className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                              <span>{sub}</span>
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-muted/30 rounded-2xl border border-dashed">
          <ListTree className="h-12 w-12 mx-auto text-muted-foreground mb-4 opacity-20" />
          <h3 className="text-lg font-medium text-foreground mb-1">No syllabus found</h3>
          <p className="text-muted-foreground">We don't have syllabus data for this selection yet.</p>
        </div>
      )}
    </div>
  );
}
