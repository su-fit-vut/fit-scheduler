from constraint import *

def get_hours_list(data):
    hours_list = []
    for x in data:
        name = x["name"] + "_" + x["type"]
        if name not in hours_list:
            hours_list.append(name)

    return hours_list

from pyodide.ffi import to_js

class ScheduleGenerator:
    def __init__(self, data):
        self.problem = Problem()
        self.problem.addVariables(range(len(data)), [0,1])
        self.data = data.to_py()
        self.hours_list = get_hours_list(self.data)
        for i, x in enumerate(self.data):
            if x != self.get_first_of_lesons(x):
                    self.problem.addConstraint(lambda a,b: a == b, [i, self.data.index(self.get_first_of_lesons(x))])

    def every_class_type_only_once(self):
        all_classes = [[] for x in range(len(self.hours_list))]
        for i,j in enumerate(self.data):
            if j == self.get_first_of_lesons(j):
                name = j["name"] + "_" + j["type"]
                index = self.hours_list.index(name)
                all_classes[index].append(i)

        for x in all_classes:
            self.problem.addConstraint(ExactSumConstraint(1), x)

    def get_first_of_lesons(self, lesson):
        for x in self.data:
                if x["name"] == lesson["name"] and x["type"] == lesson["type"] and x["group"] == lesson["group"]:
                    if x["group"] != "":
                        return x
                    else:
                        return lesson
    
    def every_hour_only_once(self):
        all_times = [[[[],[]] for y in range(max(z["to"] for z in self.data)+1)] for x in range(5)]

        for j in self.data:
            i = self.data.index(self.get_first_of_lesons(j))
            for x in range(j["from"], j["to"]):
                if j["week"] == "lichý":
                    all_times[j["day"]][x][0].append(i)
                elif j["week"] == "sudý":
                    all_times[j["day"]][x][1].append(i)
                else:
                    all_times[j["day"]][x][0].append(i)
                    all_times[j["day"]][x][1].append(i)

        for x in all_times:
            for y in x:
                for z in y:
                    if len(z) > 1:
                        self.problem.addConstraint(MaxSumConstraint(1), z)

    def add_constraint(self, max_sum, days, after, before, weighted=False):
        weights = [min(j["to"]-1,before)-max(j["from"],after)+1 for i,j in enumerate(self.data) if j["day"] in days and j["from"] <= before and after <= j["to"]-1]
        if len(weights) == 0:
            return
        if not weighted:
            weights = None
        self.problem.addConstraint(MaxSumConstraint(max_sum, weights), [i for i,j in enumerate(self.data) if j["day"] in days and j["from"] <= before and after <= j["to"]-1])

    def get_schedules_count(self):
        possibilities = 0
        for x in self.problem.getSolutionIter():
            if possibilities > 999:
                break
            possibilities += 1
        return possibilities

    def generate_schedule(self, id):
        went_over = 0
        for x in self.problem.getSolutionIter():
            if went_over == id:
                out = [0]*len(self.data)
                for y in x:
                    out[y] = x[y] == 1
                return to_js(out)
            went_over += 1
        return to_js(None)