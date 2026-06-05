function test1(arg1, arg2)
    print "noop"
end function

function test2(arg1, arg2)
    return arg1 + arg2
end function

function test3(arg1 as string, arg2 as string) as string
    return arg1 + arg2
end function

function test4(arg1 = 0, arg2 = 1) as integer
    return arg1 + arg2
end function

function test5(arg1 = 0 as float, arg2 = 1 as float)
    return arg1 + arg2
end function
