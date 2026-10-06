sub error1()
    a = 10 ' error
end sub

sub error2()
    a = 10
    print a
    a = 20 ' error
end sub

sub error3()
    a = 10 ' error
    loop:
    b = 0
    c = 10 ' should be an error but...
    d = 10
    if b < 10
        b = b + 1
        goto loop
    end if
    d = 30 ' error
end sub

sub ok1()
    a = 10
    print a
    b = 20
    Rnd(b)
end sub

sub ok2()
    m = {}
    for i = 0 to 10
        print "hello"
    end for
end sub

sub ok3()
    a = 8
    if a > 5
        if true then a = 20
        print a
    end if
end sub

sub ok4()
    a = false
    b = false
    list = ["A", "B"]
    for i = 0 to list.count() - 1
        if list[i] = "A"
            a = true
            if b
                exit for
            end if
        else if list[i] = "B"
            b = true 'assume used because `b` could have been used in another branch of the loop
            if a
                exit for
            end if
        end if
    end for
end sub

function loopInsideIf(params as object) as string
    queryString = ""
    first = true
    if params <> invalid then
        for each key in params
            if not first then
                queryString += "&"
            else
                first = false
            end if
            queryString += key
        end for
    end if
    return queryString
end function

function whileInsideIf(node as object) as object
    child = node.focusedChild
    if child <> invalid then
        while child <> invalid
            node = child
            child = node.focusedChild
        end while
    end if
    return node
end function

function loopInsideElse(params as object) as string
    queryString = ""
    first = true
    if params = invalid then
        queryString = "none"
    else
        for each key in params
            if not first then
                queryString += "&"
            else
                first = false
            end if
            queryString += key
        end for
    end if
    return queryString
end function

function loopInsideTry(params as object) as string
    queryString = ""
    first = true
    try
        for each key in params
            if not first then
                queryString += "&"
            else
                first = false
            end if
            queryString += key
        end for
    catch e
        queryString = "error"
    end try
    return queryString
end function

function unusedInLoopInsideIf(params as object) as integer
    count = 0
    if params <> invalid then
        for each key in params
            junk = 1
            count += 1
        end for
    end if
    return count
end function
