let dataApp = () => {
    return {
        page: 0,
        key: "",
        data: { faculty: [], year: [], semester: [], recap: [], Survival_CGPA: [], CGPA: [] },
        getData(id) {
            this.page = id;
            this.key = id === 1 ? "faculty" : id === 2 ? "year" : id === 3 ? "semester" : id === 4 ? "recap": id === 5 ? "Survival_CGPA": id === 6 ? "CGPA" : "";
            //console.log(`data[${this.key}] >>`, this.data[key]);
            if (this.data[this.key].length === 0) {
                fetch(`/data/${this.page}`)
                    .then((response) => response.json())
                    .then((json) => {
                        this.data[this.key] = json.rows;
                        console.log(this.data[this.key]);
                    });
            }
        },
    };
};