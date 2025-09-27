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

sub error4(unusedArg) ' error
    a = 10
    print a
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
