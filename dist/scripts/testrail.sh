#!/bin/bash
# https://flowfact.testrail.io/index.php?/api/v2/add_results_for_cases/203 {"results":[{"case_id":507,"status_id":1,"comment":"Execution time: 103167ms","elapsed":"103.167s"}]}

# export username="qa.flowfact@stacknvault.com"
# export password='1LjWm^BAzA9l%sj'

# export project_id=3
# export suite_id=4
# export include_all=false
# export name="Andoni's test 1"
# export description="This is the description"
# export case_ids=""
# export filter="checkbox"

function usage(){
    echo "usage:"
    echo
    echo "To open"
    echo "$0 --cypress-config-file <path to the cypress config file> --command open --name <\"Name of the test run\"> --description <\"Description of the test run\">"
    echo
    echo "This will return the run id"
    echo
    echo "To close"
    echo
    echo "$0 --cypress-config-file <path to the cypress config file> --command close --run-id <run id>"
}
function setConfigWhereEmpty(){
    var=$1
    query=$2
    value=$(echo $(eval "echo \$$var"))
    if [ "$value" = "" ]
    then
        thevalue=$(cat ${cypress_config_file} |jq -r "$query")
        eval "${var}=$thevalue"
    fi
    value=$(echo $(eval "echo \$$var"))
    # echo "the value from the file is $value"
}

argvalue=""
for arg in $@
do
    # echo "Arg ${arg}"
    if [ "${arg:0:2}" = "--" ]
    then
        if ! [ "$newarg" = "" ]
        then
            argvalue=$(echo $argvalue|xargs)
            # echo eval "${newarg}=\"${argvalue}\""
            eval "${newarg}=\"${argvalue}\""
            argvalue=""
            newarg=""
        fi
        newarg="${arg:2}"
        newarg=${newarg//-/_}
    else
        argvalue="${argvalue}${arg} "
    fi
done
if ! [ "$newarg" = "" ]
then
    argvalue=$(echo $argvalue|xargs)
    # echo eval "${newarg}=\"${argvalue}\""
    eval "${newarg}=\"${argvalue}\""
    argvalue=""
    newarg=""
fi

if [ "${cypress_config_file}" = "" ]
then
    echo "Missing cypress config file"
    echo
    usage
    exit 1
fi 

if [ "${command}" = "" ]
then
    echo "Missing command"
    echo
    usage
    exit 1
fi 

# cat ${cypress_config_file}
setConfigWhereEmpty host  '.reporterOptions.host'
setConfigWhereEmpty username  '.reporterOptions.username'
setConfigWhereEmpty password  '.reporterOptions.password'
setConfigWhereEmpty project_id  '.reporterOptions.projectId'
setConfigWhereEmpty suite_id  '.reporterOptions.suiteId'
setConfigWhereEmpty include_all  '.reporterOptions.includeAllInTestRun'
setConfigWhereEmpty filter  '.reporterOptions.filter'

# exit 1
# host=$(cat ${cypress_config_file} |jq -r '.reporterOptions.host')
# username=$(cat ${cypress_config_file} |jq -r '.reporterOptions.username')
# password=$(cat ${cypress_config_file} |jq -r '.reporterOptions.password')
# project_id=$(cat ${cypress_config_file} |jq -r '.reporterOptions.projectId')
# suite_id=$(cat ${cypress_config_file} |jq -r '.reporterOptions.suiteId')
# include_all=$(cat ${cypress_config_file} |jq -r '.reporterOptions.includeAllInTestRun')
# filter=$(cat ${cypress_config_file} |jq -r '.reporterOptions.filter')



# echo "$host $username $password $project_id $include_all $filter"
# exit 0

function getCases() {
    if ! [ "${include_all}" = "true" ]; then
        filter_param="&filter=${filter// /%20}"
    fi
    curl -u "${username}:${password}" -H "Content-Type: application/json" "${host}/index.php?/api/v2/get_cases/${project_id}&suite_id=${suite_id}${filter_param}" 2>/dev/null
    ret=$?
    if ! [ $ret -eq 0 ]
    then
        echo "error getting cases"
        exit 1
    fi
}
function createRun(){
    curl -u "${username}:${password}" -X POST -H "Content-Type: application/json" --data "{\"suite_id\": ${suite_id}, \"name\": \"${name}\", \"description\": \"${description}\", \"include_all\": ${include_all}, \"case_ids\": ${case_ids}}" "${host}/index.php?/api/v2/add_run/${project_id}" 2>/dev/null
    ret=$?
    if ! [ $ret -eq 0 ]
    then
        echo "error creating run"
        exit 1
    fi
}

function closeRun(){
    curl -u "${username}:${password}" -X POST -H "Content-Type: application/json" "${host}/index.php?/api/v2/close_run/${run_id}" 2>/dev/null
    ret=$?
    if ! [ $ret -eq 0 ]
    then
        echo "error closing run"
        exit 1
    fi
}

# getCases 

if [ "$command" = "open" ]
then
    if [ "${name}" = "" ]
    then
        echo "Missing name"
        echo
        usage
        exit 1
    fi 

    if [ "${description}" = "" ]
    then
        echo "Missing description"
        echo
        usage
        exit 1
    fi 

    export case_ids=$(getCases |jq '[.[]| .id]')
    run_id=$(createRun |jq '.id')
    if [ "$run_id" = "" ] || [ "$run_id" = "null" ]
    then
        echo "error creating run"
        exit 1
    fi
    echo $run_id
elif [ "$command" = "close" ]
then
    if [ "${run_id}" = "" ]
    then
        echo "Missing run id"
        echo
        usage
        exit 1
    fi 
    deleted_run_id=$(closeRun |jq '.id')
    if ! [ "$run_id" = "$deleted_run_id" ]
    then
        echo "Problems deleting run"
        exit 1
    else
        echo "Run successfully deleted"
    fi
fi
